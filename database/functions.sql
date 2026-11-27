-- ============================================================
-- KURALO BOOK — PostgreSQL Functions & Triggers
-- Run AFTER schema.sql and rls_policies.sql
-- ============================================================

-- ============================================================
-- 1. handle_new_user()
--    Automatically creates a profile row when a new Supabase
--    auth user signs up.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. create_user_cart()
--    Automatically creates an empty cart for every new profile.
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_cart()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.carts (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_create_cart ON profiles;

CREATE TRIGGER on_profile_created_create_cart
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_cart();

-- ============================================================
-- 3. generate_order_number()
--    Returns a unique order number: KB + date + 4-digit random.
--    Format: KB20241124-0742
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'KB' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
$$;

-- ============================================================
-- 4. get_cart_total(p_user_id UUID)
--    Returns the total value of a user's active cart.
--    Called server-side (service role) only.
-- ============================================================
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(p.price * ci.quantity), 0)
  INTO v_total
  FROM carts c
  JOIN cart_items ci ON ci.cart_id = c.id
  JOIN products p    ON p.id = ci.product_id
  WHERE c.user_id = p_user_id
    AND p.is_active = TRUE;

  RETURN v_total;
END;
$$;

-- ============================================================
-- 5. get_seller_pricing_rule(p_seller_id UUID, p_product_id UUID)
--    Fetches the most specific pricing rule for a given
--    seller / product combination.
--    Product-level rule takes precedence over seller-wide rule.
--    SECURITY DEFINER — never exposed to client JWT.
-- ============================================================
CREATE OR REPLACE FUNCTION get_seller_pricing_rule(
  p_seller_id  UUID,
  p_product_id UUID
)
RETURNS TABLE (
  minimum_price               NUMERIC(10,2),
  profit_floor_percentage     NUMERIC(5,2),
  max_negotiation_rounds      INTEGER,
  discount_ceiling_percentage NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try product-specific rule first
  RETURN QUERY
  SELECT
    spr.minimum_price,
    spr.profit_floor_percentage,
    spr.max_negotiation_rounds,
    spr.discount_ceiling_percentage
  FROM seller_pricing_rules spr
  WHERE spr.seller_id  = p_seller_id
    AND spr.product_id = p_product_id
  LIMIT 1;

  -- Fall back to seller-wide rule (product_id IS NULL)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      spr.minimum_price,
      spr.profit_floor_percentage,
      spr.max_negotiation_rounds,
      spr.discount_ceiling_percentage
    FROM seller_pricing_rules spr
    WHERE spr.seller_id  = p_seller_id
      AND spr.product_id IS NULL
    LIMIT 1;
  END IF;
END;
$$;

-- ============================================================
-- 6. expire_old_bargaining_sessions()
--    Marks sessions older than 24 hours as expired.
--    Intended to run periodically via pg_cron or Supabase Edge Function.
-- ============================================================
CREATE OR REPLACE FUNCTION expire_old_bargaining_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE bargaining_sessions
  SET    status     = 'expired',
         updated_at = NOW()
  WHERE  status     = 'active'
    AND  created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 7. ensure_single_default_address()
--    When a user sets an address as default, clears the flag
--    on all their other addresses.
-- ============================================================
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE addresses
    SET    is_default = FALSE
    WHERE  user_id = NEW.user_id
      AND  id      <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_default_address ON addresses;

CREATE TRIGGER trg_ensure_single_default_address
  AFTER INSERT OR UPDATE OF is_default ON addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_address();

-- ============================================================
-- 8. update_product_stock_on_order()
--    Decrements stock when an order is placed.
--    Runs AFTER INSERT on order_items.
-- ============================================================
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET    stock      = GREATEST(stock - NEW.quantity, 0),
         updated_at = NOW()
  WHERE  id = NEW.product_id
    AND  stock >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_stock_on_order_item ON order_items;

CREATE TRIGGER trg_update_stock_on_order_item
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_order();

-- ============================================================
-- 9. update_seller_total_sales()
--    Increments seller.total_sales when an order is confirmed.
-- ============================================================
CREATE OR REPLACE FUNCTION update_seller_total_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_status = 'confirmed' AND OLD.order_status <> 'confirmed' THEN
    UPDATE sellers s
    SET    total_sales = total_sales + oi.qty_sum
    FROM (
      SELECT p.seller_id, SUM(oi2.quantity) AS qty_sum
      FROM   order_items oi2
      JOIN   products p ON p.id = oi2.product_id
      WHERE  oi2.order_id = NEW.id
      GROUP  BY p.seller_id
    ) oi
    WHERE s.id = oi.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_seller_total_sales ON orders;

CREATE TRIGGER trg_update_seller_total_sales
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_total_sales();
