-- ============================================================
-- KURALO BOOK — PostgreSQL Schema
-- Run this FIRST before rls_policies.sql, functions.sql, seed_data.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- profiles (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================
-- sellers
-- ============================================================
CREATE TABLE IF NOT EXISTS sellers (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  business_name   TEXT          NOT NULL,
  description     TEXT,
  rating          NUMERIC(2,1)  NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  total_sales     INTEGER       NOT NULL DEFAULT 0,
  verified        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id  ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_verified ON sellers(verified);

-- ============================================================
-- seller_pricing_rules  (CONFIDENTIAL — strict RLS, service role only)
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_pricing_rules (
  id                          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id                   UUID          NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id                  UUID,                              -- NULL = applies to all products of this seller
  minimum_price               NUMERIC(10,2) NOT NULL,
  profit_floor_percentage     NUMERIC(5,2)  NOT NULL DEFAULT 15.0,
  max_negotiation_rounds      INTEGER       NOT NULL DEFAULT 3,
  discount_ceiling_percentage NUMERIC(5,2)  NOT NULL DEFAULT 20.0,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_seller   ON seller_pricing_rules(seller_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_product  ON seller_pricing_rules(product_id);

-- ============================================================
-- products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID          REFERENCES sellers(id) ON DELETE SET NULL,
  category_id     UUID          REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT          NOT NULL,
  description     TEXT,
  specifications  JSONB         NOT NULL DEFAULT '{}',
  price           NUMERIC(10,2) NOT NULL CHECK (price > 0),
  mrp             NUMERIC(10,2) NOT NULL CHECK (mrp > 0),
  stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images          TEXT[]        NOT NULL DEFAULT '{}',
  rating          NUMERIC(2,1)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  reviews_count   INTEGER       NOT NULL DEFAULT 0,
  is_featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_price_lte_mrp CHECK (price <= mrp)
);

CREATE INDEX IF NOT EXISTS idx_products_seller       ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category     ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active    ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured  ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_tags         ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_specs        ON products USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_products_name_search  ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================
-- carts
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- ============================================================
-- cart_items
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id     UUID        NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ============================================================
-- bargaining_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS bargaining_sessions (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id            UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  listed_price          NUMERIC(10,2) NOT NULL,
  final_accepted_price  NUMERIC(10,2),
  status                TEXT          NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','accepted','rejected','expired')),
  language              TEXT          NOT NULL DEFAULT 'en'
                          CHECK (language IN ('en','ta','hi')),
  negotiation_round     INTEGER       NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barg_sessions_user    ON bargaining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_barg_sessions_product ON bargaining_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_barg_sessions_status  ON bargaining_sessions(status);

-- ============================================================
-- bargaining_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS bargaining_messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID        NOT NULL REFERENCES bargaining_sessions(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('ai','customer')),
  content     TEXT        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}',  -- offer amounts only; NEVER minimum_price
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barg_messages_session ON bargaining_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_barg_messages_role    ON bargaining_messages(session_id, role);

-- ============================================================
-- addresses
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  phone           TEXT        NOT NULL,
  address_line1   TEXT        NOT NULL,
  address_line2   TEXT,
  city            TEXT        NOT NULL,
  state           TEXT        NOT NULL,
  pincode         TEXT        NOT NULL,
  is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          TEXT          NOT NULL UNIQUE,
  user_id               UUID          NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_id            UUID          REFERENCES addresses(id) ON DELETE SET NULL,
  bargaining_session_id UUID          REFERENCES bargaining_sessions(id) ON DELETE SET NULL,
  subtotal              NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
  tax_amount            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount          NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method        TEXT,
  payment_status        TEXT          NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status          TEXT          NOT NULL DEFAULT 'placed'
                          CHECK (order_status IN ('placed','confirmed','processing','shipped','delivered','cancelled')),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user           ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number   ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status   ON orders(order_status);

-- ============================================================
-- order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID          REFERENCES products(id) ON DELETE SET NULL,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id             UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  amount               NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency             TEXT          NOT NULL DEFAULT 'INR',
  status               TEXT          NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order              ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order     ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment   ON payments(razorpay_payment_id);

-- ============================================================
-- wishlists
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user    ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- ============================================================
-- updated_at auto-update helper (applied via triggers below)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at         BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_seller_pricing_updated_at   BEFORE UPDATE ON seller_pricing_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at         BEFORE UPDATE ON products         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carts_updated_at            BEFORE UPDATE ON carts            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_barg_sessions_updated_at    BEFORE UPDATE ON bargaining_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at           BEFORE UPDATE ON orders           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
