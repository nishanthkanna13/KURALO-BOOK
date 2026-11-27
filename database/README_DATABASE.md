# Kuralo Book — Database Setup Guide

## Overview

The database layer for **Kuralo Book** is built on **Supabase** (PostgreSQL 15+).  
It includes:

| File | Purpose |
|------|---------|
| `schema.sql` | All tables, indexes, `updated_at` triggers |
| `rls_policies.sql` | Row Level Security — users see only their own data |
| `functions.sql` | PostgreSQL functions & triggers for business logic |
| `seed_data.sql` | 8 categories, 3 sellers, 20 products, pricing rules |

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose your organisation, give the project a name (e.g. `kuralo-book`), set a strong database password, and pick the nearest region (e.g. `ap-south-1` for India).
4. Wait ~2 minutes for provisioning.

---

## 2. Enable Required Auth Providers

In your Supabase dashboard:

1. Navigate to **Authentication → Providers**.
2. Enable **Email** (enabled by default — verify "Confirm email" is ON in production).
3. *(Optional)* Enable **Google OAuth**:
   - Add your Google Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com).
   - Set the Redirect URL in Google Console to: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. *(Optional)* Enable **Phone (OTP)** via Twilio for Indian users.

---

## 3. Run Migrations in Order

Open the **Supabase SQL Editor** (Dashboard → SQL Editor → New query) and run each file in this exact order:

### Step 1 — Schema
```sql
-- Paste contents of schema.sql
```
> Creates all tables, indexes and the `set_updated_at` trigger helper.

### Step 2 — RLS Policies
```sql
-- Paste contents of rls_policies.sql
```
> Enables Row Level Security and creates all access policies.

### Step 3 — Functions
```sql
-- Paste contents of functions.sql
```
> Creates PostgreSQL functions, `handle_new_user`, `create_user_cart`, stock and sales triggers.

### Step 4 — Seed Data
```sql
-- Paste contents of seed_data.sql
```
> Inserts 8 categories, 3 verified sellers, 20 products and seller pricing rules.

> [!IMPORTANT]
> Always run in this order. `rls_policies.sql` depends on tables from `schema.sql`, and `functions.sql` creates auth triggers that need the `profiles` table.

---

## 4. Retrieve API Keys

1. Go to **Project Settings → API**.
2. Copy the following values into your `.env` files:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | "Project URL" |
| `SUPABASE_ANON_KEY` | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role secret" key — **backend only, never expose to client** |

### Frontend `.env` (Vite)
```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend `.env` (FastAPI)
```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> [!CAUTION]
> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It bypasses all RLS policies and has full database access.

---

## 5. Schema Architecture

### Key Design Decisions

#### 🔐 Seller Pricing Rules (Confidential)
The `seller_pricing_rules` table stores the AI bargaining floors:
- **RLS policy blocks all client access** (`USING (false)`)
- Accessed **only** by the FastAPI backend using `service_role_key`
- The `get_seller_pricing_rule()` function is `SECURITY DEFINER` — called server-side
- `minimum_price` is **never sent to the client** in bargaining messages

#### 🛒 Cart Architecture
- One cart per user, created automatically via trigger when a profile is created
- Cart items reference products directly; price is re-fetched at checkout
- `get_cart_total()` is a server-side function (never trusted from client)

#### 💬 Bargaining Sessions
- One active session per product per user (enforced at application layer)
- `bargaining_messages.metadata` stores offer amounts only — never `minimum_price`
- Sessions auto-expire after 24 hours via `expire_old_bargaining_sessions()`

#### 📦 Order Flow
```
Cart → Order (placed) → confirmed → processing → shipped → delivered
                                ↘ cancelled
```
Stock is decremented via trigger on `order_items` INSERT.

---

## 6. Setting Up pg_cron for Session Expiry (Optional)

To auto-expire bargaining sessions daily:

```sql
-- Enable pg_cron extension (Supabase supports this)
SELECT cron.schedule(
  'expire-bargaining-sessions',
  '0 2 * * *',   -- 2 AM daily
  $$SELECT expire_old_bargaining_sessions()$$
);
```

---

## 7. Useful Queries

### Check all active bargaining sessions
```sql
SELECT bs.id, p.name, bs.listed_price, bs.negotiation_round, bs.status
FROM bargaining_sessions bs
JOIN products p ON p.id = bs.product_id
WHERE bs.status = 'active'
ORDER BY bs.created_at DESC;
```

### Get cart total for a user
```sql
SELECT get_cart_total('<user-uuid>');
```

### Top featured products
```sql
SELECT name, price, mrp, rating, reviews_count
FROM products
WHERE is_featured = TRUE AND is_active = TRUE
ORDER BY rating DESC, reviews_count DESC;
```

### Revenue summary by seller
```sql
SELECT s.business_name, SUM(oi.total_price) AS revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN sellers s ON s.id = p.seller_id
JOIN orders o ON o.id = oi.order_id
WHERE o.payment_status = 'paid'
GROUP BY s.business_name
ORDER BY revenue DESC;
```

---

## 8. File Structure

```
database/
├── schema.sql            ← Run first
├── rls_policies.sql      ← Run second
├── functions.sql         ← Run third
├── seed_data.sql         ← Run fourth
└── README_DATABASE.md    ← This file
```
