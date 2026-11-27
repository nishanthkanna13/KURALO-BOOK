-- ============================================================
-- KURALO BOOK — Seed Data
-- Run AFTER schema.sql, rls_policies.sql, functions.sql
-- ============================================================

-- ============================================================
-- Categories
-- ============================================================
INSERT INTO categories (id, name, slug, icon, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Electronics',       'electronics',       '📱', 'Smartphones, earbuds, laptops, accessories and more'),
  ('11111111-0000-0000-0000-000000000002', 'Fashion',           'fashion',           '👗', 'Clothing, footwear, accessories for men and women'),
  ('11111111-0000-0000-0000-000000000003', 'Home & Living',     'home-living',       '🏠', 'Kitchen appliances, decor, furniture essentials'),
  ('11111111-0000-0000-0000-000000000004', 'Books',             'books',             '📚', 'Bestsellers, textbooks, fiction, non-fiction'),
  ('11111111-0000-0000-0000-000000000005', 'Sports & Fitness',  'sports-fitness',    '⚽', 'Equipment, activewear, supplements and gear'),
  ('11111111-0000-0000-0000-000000000006', 'Beauty & Care',     'beauty-care',       '💄', 'Skincare, haircare, grooming and wellness products'),
  ('11111111-0000-0000-0000-000000000007', 'Food & Groceries',  'food-groceries',    '🛒', 'Packaged foods, beverages, dry fruits and spices'),
  ('11111111-0000-0000-0000-000000000008', 'Toys & Games',      'toys-games',        '🧸', 'Educational toys, board games and outdoor play')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Sellers
-- ============================================================
INSERT INTO sellers (id, business_name, description, rating, total_sales, verified) VALUES
  ('22222222-0000-0000-0000-000000000001', 'TechZone India',     'Authorised reseller of top electronics brands. Fast shipping across India.', 4.7, 12840, TRUE),
  ('22222222-0000-0000-0000-000000000002', 'DesiMart Online',    'Your one-stop shop for Indian household brands and FMCG products.',          4.5,  8320, TRUE),
  ('22222222-0000-0000-0000-000000000003', 'StyleHub India',     'Trending fashion, sportswear and lifestyle products at unbeatable prices.',   4.4,  6150, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Products (20 realistic Indian market products)
-- ============================================================
INSERT INTO products (
  id, seller_id, category_id, name, description,
  specifications, price, mrp, stock, images,
  rating, reviews_count, is_featured, is_active, tags
) VALUES

-- 1. Boat Airdopes 141
(
  '33333333-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'boAt Airdopes 141 Bluetooth TWS Earbuds',
  'Experience 42 hours of total playback with ENx™ technology for clear calls. IPX4 rated for sweat and water resistance. Instant voice assistant access.',
  '{"driver": "6mm dynamic", "battery_earbuds": "5h", "battery_case": "37h", "connectivity": "Bluetooth 5.1", "water_resistance": "IPX4", "color": "Active Black", "weight_g": 38}',
  999, 2499, 450,
  ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
  4.2, 128450, TRUE, TRUE,
  ARRAY['earbuds','tws','boat','bluetooth','wireless']
),

-- 2. Samsung Galaxy M14 5G
(
  '33333333-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'Samsung Galaxy M14 5G (4GB RAM, 128GB Storage)',
  '50MP triple camera, Exynos 1330 processor, 6000mAh battery, Android 13, 6.6-inch FHD+ display. Ideal for all-day productivity.',
  '{"display": "6.6-inch FHD+ 90Hz", "processor": "Exynos 1330", "ram": "4GB", "storage": "128GB", "battery": "6000mAh", "camera_rear": "50MP+2MP+2MP", "camera_front": "13MP", "5g": true, "os": "Android 13"}',
  13499, 16999, 180,
  ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'],
  4.4, 34210, TRUE, TRUE,
  ARRAY['samsung','galaxy','5g','smartphone','android']
),

-- 3. Boat Rockerz 450 Wireless Headphones
(
  '33333333-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'boAt Rockerz 450 Bluetooth On-Ear Headphones',
  'Premium 40mm drivers, 15 hours playback, foldable design with plush cushions. Super Extra Bass for immersive audio experience.',
  '{"driver": "40mm", "battery": "15h", "connectivity": "Bluetooth 5.0", "mic": true, "foldable": true, "color": "Luscious Black"}',
  1299, 2990, 320,
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
  4.1, 56780, FALSE, TRUE,
  ARRAY['headphones','wireless','boat','bluetooth','bass']
),

-- 4. Prestige Iris 750W Mixer Grinder
(
  '33333333-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  'Prestige Iris 750W Mixer Grinder with 3 Jars',
  '750W motor, 3 SS jars (1.5L, 1L, 0.5L), 3-speed control with pulse, overload protector, 2-year warranty. Ideal for Indian cooking.',
  '{"power_w": 750, "jars": 3, "jar_capacity": "1.5L + 1L + 0.5L", "speeds": 3, "material": "Stainless Steel", "warranty": "2 years"}',
  2199, 3499, 210,
  ARRAY['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800'],
  4.3, 22140, FALSE, TRUE,
  ARRAY['prestige','mixer','grinder','kitchen','appliance']
),

-- 5. Wildcraft Trailblazer 30L Backpack
(
  '33333333-0000-0000-0000-000000000005',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000005',
  'Wildcraft Trailblazer 30L Backpack',
  'Ergonomic shoulder straps, padded laptop sleeve (fits 15.6"), water-resistant nylon, multiple organiser pockets. Perfect for college and travel.',
  '{"capacity_L": 30, "material": "600D Nylon", "laptop_sleeve": "15.6 inch", "water_resistant": true, "color": "Charcoal Grey", "weight_kg": 0.72}',
  1199, 1999, 530,
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
  4.0, 14320, FALSE, TRUE,
  ARRAY['wildcraft','backpack','travel','college','bag']
),

-- 6. Himalaya Neem Face Wash
(
  '33333333-0000-0000-0000-000000000006',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000006',
  'Himalaya Herbals Purifying Neem Face Wash 150ml',
  'Clinically tested neem and turmeric formula. Controls pimples, removes excess oil, leaves skin fresh. Suitable for all skin types.',
  '{"volume_ml": 150, "type": "Gel", "skin_type": "All", "key_ingredients": ["Neem", "Turmeric"], "dermatologist_tested": true}',
  149, 199, 2800,
  ARRAY['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800'],
  4.5, 98340, TRUE, TRUE,
  ARRAY['himalaya','facewash','skincare','neem','herbal']
),

-- 7. Levi's 511 Slim Fit Jeans
(
  '33333333-0000-0000-0000-000000000007',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000002',
  "Levi's 511 Slim Fit Men's Jeans (Dark Blue)",
  'Iconic Levi''s slim fit with stretch comfort. Mid-rise, sits below waist. 98% cotton, 2% elastane for all-day comfort. Machine washable.',
  '{"fit": "Slim", "rise": "Mid", "material": "98% Cotton 2% Elastane", "color": "Dark Blue Rinse", "closure": "Zip fly + button", "wash_care": "Machine wash cold"}',
  2499, 3999, 125,
  ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'],
  4.3, 18920, TRUE, TRUE,
  ARRAY['levis','jeans','denim','fashion','men']
),

-- 8. Instant Pot Duo 7-in-1 Electric Pressure Cooker
(
  '33333333-0000-0000-0000-000000000008',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  'Instant Pot Duo 7-in-1 Electric Pressure Cooker 5.7L',
  'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and food warmer in one. Saves up to 70% cooking time.',
  '{"capacity_L": 5.7, "functions": 7, "preset_programs": 14, "material": "Stainless Steel", "power_w": 1000, "safety_mechanisms": 10}',
  7999, 11999, 88,
  ARRAY['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800'],
  4.6, 32100, TRUE, TRUE,
  ARRAY['instantpot','pressure cooker','kitchen','cooking','appliance']
),

-- 9. Fastrack Stunners Casual Watch
(
  '33333333-0000-0000-0000-000000000009',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000002',
  'Fastrack Stunners Analog Watch for Men',
  'Bold round dial with day-date display, mineral glass, stainless steel case, genuine leather strap. Water-resistant up to 30m.',
  '{"dial_diameter_mm": 46, "case_material": "Stainless Steel", "strap_material": "Leather", "water_resistance_m": 30, "movement": "Quartz", "display": "Analog with Day-Date"}',
  1299, 2495, 240,
  ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'],
  4.1, 9870, FALSE, TRUE,
  ARRAY['fastrack','watch','men','analog','fashion']
),

-- 10. Mamaearth Vitamin C Face Serum
(
  '33333333-0000-0000-0000-000000000010',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000006',
  'Mamaearth Vitamin C Face Serum with Turmeric 30ml',
  'Brightens dull skin, reduces dark spots and pigmentation. Enriched with Vitamin C and Turmeric. Dermatologically tested, toxin-free.',
  '{"volume_ml": 30, "key_ingredients": ["Vitamin C 1%", "Turmeric"], "skin_concern": ["Brightening", "Dark Spots"], "shelf_life_months": 24, "toxin_free": true}',
  449, 699, 1500,
  ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'],
  4.4, 41200, TRUE, TRUE,
  ARRAY['mamaearth','serum','vitaminc','skincare','brightening']
),

-- 11. Crompton Aura LED Desk Lamp
(
  '33333333-0000-0000-0000-000000000011',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  'Crompton Aura LED Desk Lamp 10W (Eye-Care)',
  'Flicker-free, eye-care LED with 3 colour temperature modes (warm/cool/natural). Adjustable neck, USB charging port, touch dimmer.',
  '{"power_w": 10, "lumens": 800, "color_temp_modes": 3, "usb_port": true, "dimmer": true, "material": "ABS Plastic", "voltage": "240V"}',
  899, 1499, 380,
  ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'],
  4.2, 7640, FALSE, TRUE,
  ARRAY['crompton','led','lamp','study','desk']
),

-- 12. Tata Sampann Chana Dal 1kg
(
  '33333333-0000-0000-0000-000000000012',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000007',
  'Tata Sampann Unpolished Chana Dal 1kg',
  'Naturally unpolished to retain maximum nutrition. Rich in protein and fibre. Direct from the farm, no added chemicals.',
  '{"weight_g": 1000, "type": "Chana Dal", "polish": "Unpolished", "shelf_life_months": 12, "source": "Farm Fresh"}',
  115, 149, 5000,
  ARRAY['https://images.unsplash.com/photo-1612257999756-6e8a28f28f5d?w=800'],
  4.5, 23100, FALSE, TRUE,
  ARRAY['tata','dal','grocery','protein','lentils']
),

-- 13. Puma Men's Running Shoes (Flyer Flex)
(
  '33333333-0000-0000-0000-000000000013',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000005',
  'Puma Flyer Flex Running Shoes for Men',
  'Lightweight mesh upper, EVA cushioned midsole, rubber outsole for grip. Ideal for jogging, gym and casual wear.',
  '{"type": "Running", "upper": "Mesh", "sole": "Rubber", "midsole": "EVA", "gender": "Men", "closure": "Lace-up", "color": "Black-White"}',
  2499, 3499, 190,
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
  4.2, 11430, FALSE, TRUE,
  ARRAY['puma','shoes','running','sports','men']
),

-- 14. Milton Thermosteel Flip Lid Flask 500ml
(
  '33333333-0000-0000-0000-000000000014',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  'Milton Thermosteel Flip Lid Flask 500ml',
  'Double wall vacuum insulated, keeps hot 24 hours and cold 48 hours. Stainless steel 304 food-grade interior, spill-proof lid.',
  '{"capacity_ml": 500, "material": "SS 304 Food Grade", "hot_hours": 24, "cold_hours": 48, "lid_type": "Flip", "leak_proof": true}',
  649, 999, 820,
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800'],
  4.4, 29870, TRUE, TRUE,
  ARRAY['milton','flask','thermos','insulated','kitchen']
),

-- 15. Wakefit Orthopaedic Memory Foam Pillow
(
  '33333333-0000-0000-0000-000000000015',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  'Wakefit Orthopaedic Memory Foam Pillow (Medium Firm)',
  'Contoured cervical support, breathable cooling cover, CertiPUR certified foam. Ideal for back and side sleepers.',
  '{"dimensions_cm": "60x38x12", "fill": "Memory Foam", "cover": "Breathable Knitted", "firmness": "Medium Firm", "certifications": ["CertiPUR"], "trial_days": 100}',
  1299, 1999, 310,
  ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800'],
  4.5, 16540, FALSE, TRUE,
  ARRAY['wakefit','pillow','sleep','orthopaedic','foam']
),

-- 16. Atomic Habits by James Clear (Paperback)
(
  '33333333-0000-0000-0000-000000000016',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004',
  'Atomic Habits — James Clear (Paperback)',
  'The life-changing million-copy #1 bestseller. Practical strategies to build good habits and break bad ones. Perfect for anyone striving for peak performance.',
  '{"author": "James Clear", "publisher": "Penguin Random House", "pages": 320, "language": "English", "isbn": "9780735211292", "edition": "Paperback"}',
  499, 799, 650,
  ARRAY['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'],
  4.9, 87200, TRUE, TRUE,
  ARRAY['book','atomic habits','self-help','james clear','bestseller']
),

-- 17. Funskool Ludo Star Board Game
(
  '33333333-0000-0000-0000-000000000017',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000008',
  'Funskool Ludo Star Board Game (2–6 Players)',
  'Classic Indian board game with premium folding board, vivid tokens, and dice. Great family entertainment for all ages.',
  '{"players": "2-6", "age_years": "5+", "material": "PVC Board + Plastic Tokens", "includes": ["Board", "36 Tokens", "2 Dice", "Instructions"]}',
  299, 449, 1200,
  ARRAY['https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800'],
  4.3, 8910, FALSE, TRUE,
  ARRAY['ludo','board game','family','funskool','kids']
),

-- 18. Nykaa Cosmetics Cherry Red Matte Lipstick
(
  '33333333-0000-0000-0000-000000000018',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000006',
  "Nykaa Cosmetics So Matte! Lipstick — Cherry Red 02",
  'Ultra-matte finish, long-wearing formula, enriched with Vitamin E for smooth application. 8-hour wear, dermatologist tested.',
  '{"shade": "Cherry Red 02", "finish": "Matte", "net_weight_g": 4.2, "vitamin_e": true, "wear_hours": 8, "dermatologist_tested": true}',
  349, 499, 940,
  ARRAY['https://images.unsplash.com/photo-1586495777744-4e6b0c1b5f35?w=800'],
  4.0, 12760, FALSE, TRUE,
  ARRAY['nykaa','lipstick','matte','beauty','makeup']
),

-- 19. Nivia Storm Football (Size 5)
(
  '33333333-0000-0000-0000-000000000019',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000005',
  'Nivia Storm Football Size 5 (Machine Stitched)',
  '32-panel machine-stitched football, PU synthetic leather, butyl bladder for superior air retention. FIFA approved dimensions.',
  '{"size": 5, "panels": 32, "material": "PU Synthetic Leather", "bladder": "Butyl", "stitching": "Machine", "circumference_cm": "68-70"}',
  699, 999, 440,
  ARRAY['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800'],
  4.2, 6230, FALSE, TRUE,
  ARRAY['nivia','football','soccer','sports','outdoor']
),

-- 20. Dabur Honey 500g
(
  '33333333-0000-0000-0000-000000000020',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000007',
  'Dabur Honey 100% Pure — 500g',
  'No added sugar. Tested on 25+ quality parameters. Naturally sourced from Himalayan bee farms. Ideal for immunity, fitness and cooking.',
  '{"weight_g": 500, "purity": "100% Pure", "source": "Himalayan Farms", "quality_checks": 25, "shelf_life_months": 24}',
  229, 299, 3500,
  ARRAY['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
  4.6, 54320, TRUE, TRUE,
  ARRAY['dabur','honey','grocery','organic','immunity']
)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seller Pricing Rules
-- (minimum_price ≈ 70% of listed price; never exposed to clients)
-- ============================================================
INSERT INTO seller_pricing_rules (
  seller_id, product_id, minimum_price, profit_floor_percentage,
  max_negotiation_rounds, discount_ceiling_percentage
) VALUES

-- TechZone India — global floor
('22222222-0000-0000-0000-000000000001', NULL, 100.00, 15.0, 3, 20.0),

-- Product-specific overrides for TechZone
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',  699.00, 15.0, 3, 25.0),  -- Boat Airdopes: min ₹699
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 9449.00, 18.0, 2, 15.0),  -- Samsung M14: min ₹9449
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003',  909.00, 15.0, 3, 20.0),  -- Boat Rockerz: min ₹909

-- DesiMart Online — global floor
('22222222-0000-0000-0000-000000000002', NULL, 50.00, 12.0, 3, 20.0),

-- Product-specific overrides for DesiMart
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004', 1539.00, 15.0, 3, 20.0),  -- Prestige mixer: min ₹1539
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000006',  104.00, 10.0, 3, 25.0),  -- Himalaya FW: min ₹104
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000008', 5599.00, 20.0, 2, 15.0),  -- Instant Pot: min ₹5599
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000016',  349.00, 10.0, 3, 25.0),  -- Atomic Habits: min ₹349

-- StyleHub India — global floor
('22222222-0000-0000-0000-000000000003', NULL, 80.00, 12.0, 3, 25.0),

-- Product-specific overrides for StyleHub
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000005',  839.00, 12.0, 3, 25.0),  -- Wildcraft: min ₹839
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000007', 1749.00, 15.0, 3, 20.0),  -- Levi's: min ₹1749
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000009',  909.00, 12.0, 3, 25.0),  -- Fastrack: min ₹909
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000013', 1749.00, 15.0, 3, 20.0)   -- Puma shoes: min ₹1749
;
