-- ============================================================
-- KURALO BOOK — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- Enable RLS on every user-data table
-- ============================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bargaining_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bargaining_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_pricing_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- seller_pricing_rules  — CONFIDENTIAL
-- No client-side access.  Only service_role key (backend) may read.
-- The FALSE policy ensures every anon/authenticated JWT is blocked.
-- ============================================================
CREATE POLICY "pricing_rules_no_client_access"
  ON seller_pricing_rules
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- categories  — public read-only
-- ============================================================
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- ============================================================
-- sellers  — public read-only (for storefront display)
-- ============================================================
CREATE POLICY "sellers_public_read"
  ON sellers FOR SELECT
  USING (true);

-- ============================================================
-- products  — publicly readable when active
-- ============================================================
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (is_active = true);

-- ============================================================
-- carts  — users own their cart
-- ============================================================
CREATE POLICY "carts_owner_all"
  ON carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- cart_items  — owned via cart ownership
-- ============================================================
CREATE POLICY "cart_items_owner_all"
  ON cart_items FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM carts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    cart_id IN (
      SELECT id FROM carts WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- bargaining_sessions
-- ============================================================
CREATE POLICY "barg_sessions_owner_select"
  ON bargaining_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "barg_sessions_owner_insert"
  ON bargaining_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "barg_sessions_owner_update"
  ON bargaining_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- bargaining_messages
-- Users can read messages from their sessions; inserts go via service role.
-- metadata MUST NOT contain minimum_price — enforced at application layer.
-- ============================================================
CREATE POLICY "barg_messages_owner_select"
  ON bargaining_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM bargaining_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "barg_messages_owner_insert"
  ON bargaining_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM bargaining_sessions WHERE user_id = auth.uid()
    )
    AND role = 'customer'   -- AI messages inserted by service role only
  );

-- ============================================================
-- addresses
-- ============================================================
CREATE POLICY "addresses_owner_all"
  ON addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- orders
-- ============================================================
CREATE POLICY "orders_owner_select"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_owner_insert"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Status updates (e.g., cancellation) allowed by owner
CREATE POLICY "orders_owner_update"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- order_items  — readable via order ownership
-- ============================================================
CREATE POLICY "order_items_owner_select"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Inserts done by service role during order creation
-- No client INSERT policy needed

-- ============================================================
-- payments  — readable by order owner
-- ============================================================
CREATE POLICY "payments_owner_select"
  ON payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Inserts/updates handled by backend service role (Razorpay webhook)

-- ============================================================
-- wishlists
-- ============================================================
CREATE POLICY "wishlists_owner_all"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
