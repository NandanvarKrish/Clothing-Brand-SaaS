-- ==============================================================================
-- MIGRATION: 20261018000003_seed_catalog.sql
-- DESCRIPTION: Seed initial tenant, business settings, categories, collections,
--              apparel products, variants, inventory, and promotional coupons.
-- ==============================================================================

-- 1. TENANT
INSERT INTO tenants (id, name, slug, domain, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'Velure Atelier', 'velure-atelier', 'velure.atelier', 'INR')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency;

-- 2. BUSINESS SETTINGS
INSERT INTO business_settings (tenant_id, support_email, support_phone, free_shipping_threshold, standard_shipping_fee, cod_handling_fee, tax_rate_percent, cod_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 'concierge@velureatelier.com', '+91 98765 43210', 1999.00, 250.00, 100.00, 12.00, true)
ON CONFLICT (tenant_id) DO UPDATE SET support_email = EXCLUDED.support_email, free_shipping_threshold = EXCLUDED.free_shipping_threshold;

-- 3. CATEGORIES
INSERT INTO categories (id, tenant_id, name, slug, description)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Outerwear', 'outerwear', 'Tailored coats, jackets, and architectural overshirts crafted from unbleached linen and virgin wool.'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Dresses', 'dresses', 'Bias-cut and handloom midi silhouettes spun in pure mulberry and tussar silks.'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Tops', 'tops', 'Relaxed band-collar and resort shirts crafted in organic Belgian flax and gossamer cotton.'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Bottoms', 'bottoms', 'Double-pleated trousers and tailored pants designed with fluid drape and natural horn buttons.'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Knitwear', 'knitwear', 'Fine-gauge Mongolian cashmere and organic merino knitwear for transitional warmth.')
ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 4. COLLECTIONS
INSERT INTO collections (id, tenant_id, title, slug, tagline, description, image_url, edition_badge, is_active)
VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Autumn Dusk 2024', 'autumn-dusk-2024', 'Edition 08 Capsule', 'Warm tobacco silks, textured hazelnut linens, and unlined evening coats designed for seasonal twilight.', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop', 'Edition 08', true),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Everyday Linen', 'everyday-linen', 'The Core Line', 'Breathable Belgian flax softened through artisan water washes and tailored into timeless silhouettes.', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop', 'Core Line', true),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Artisanal Silk', 'artisanal-silk', 'Heritage Looms', 'Hand-spun raw silk and wild Tussar woven on handlooms with fluid drape and natural luster.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop', 'Heritage Looms', true),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sculpted Outerwear', 'sculpted-outerwear', 'Architectural Cut', 'Tailored contours, structured shoulders, and horn hardware built for graceful transitional layering.', 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop', 'Architectural Cut', true)
ON CONFLICT (tenant_id, slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, image_url = EXCLUDED.image_url;

-- 5. PRODUCTS
INSERT INTO products (id, tenant_id, category_id, name, slug, subtitle, description, fabric, fabric_origin, weave_technique, gsm, edition, badge, price, compare_at_price, is_featured, is_bestseller, is_new_arrival, is_active, rating, review_count, details, care, shipping_info)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Linen Chore Jacket', 'linen-chore-jacket-espresso', 'Espresso Brown • 320 GSM', 'A structured yet relaxed chore silhouette crafted in 320 GSM pure Belgian heavy linen with custom genuine horn buttons, reinforced patch pockets, and interior bound seams for lifetime longevity.', 'Pure Linen', 'Belgian Organic Linen', 'Single Origin Handloom', 320, 'Edition 08 / 120', 'Low Batch (8 left)', 4200.00, 4800.00, true, true, false, true, 4.90, 34, '["320 GSM heavyweight natural unbleached flax milled in Flanders, Belgium","Vegetal yarn-dyed using organic tannins that develop a rich patina with wear","Genuine carved dark horn button fastenings with cross-tack stitching","Full interior cotton seam-binding (zero raw edges)","Triple-stitched stress points and double-layered patch pockets"]'::jsonb, '["Dry clean or hand wash gently in cold water with mild enzyme-free detergent","Do not wring or tumble dry; dry flat in natural shade","Warm iron while slightly damp for crisp artisanal texture"]'::jsonb, 'Complimentary domestic priority air shipping via BlueDart. Delivered in 2-3 business days.'),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Raw Silk Midi Dress', 'raw-silk-midi-dress-sand-dune', 'Sand Dune • Bias Cut', 'An effortless bias-cut silhouette crafted from handloom raw Mulberry silk. Featuring delicate tie straps, French seams, and a flowing drape that catches natural light with understated elegance.', 'Raw Silk', 'Mulberry & Tussar Silk', 'Single Origin Handloom', 210, 'Edition 06 / 150', 'Bestseller', 3850.00, 4400.00, true, true, false, true, 5.00, 42, '["100% handspun raw Mulberry silk with organic slub texture","Fluid bias cut contours gracefully along the body","Hand-rolled clean hems and French internal seams","Adjustable slender back ties for a custom fit"]'::jsonb, '["Professional dry clean recommended","Steam gently inside out on silk setting"]'::jsonb, 'Complimentary air shipping across India. Ready to ship.'),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sculpted Tailored Blazer', 'sculpted-tailored-blazer-espresso', 'Dark Espresso • Double-Faced', 'An architectural double-faced blazer cut with razor-sharp peak lapels, floating canvas chest piece, and bespoke horn hardware. Tailored to move effortlessly from atelier salons to autumn twilight.', 'Linen-Wool Blend', 'Belgian Organic Linen', 'Heavy Flax Twill', 360, 'Edition 03 / 90', 'Limited Run (12 left)', 6200.00, 7100.00, true, false, true, true, 4.80, 19, '["Double-faced Belgian flax linen blended with fine combed wool","Half-canvas chest construction for dynamic drape and shape retention","Hand-sewn pick stitching along the peak lapel edge","Genuine dark buffalo horn buttons with subtle color marbling","Double back vents for ease of movement"]'::jsonb, '["Specialist dry clean only","Store on contoured wooden hanger in provided breathable garment bag"]'::jsonb, 'Complimentary air shipping with signature delivery on arrival.'),
  ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Oversized Handspun Tunic', 'oversized-handspun-tunic-ecru', 'Ecru Raw • Bengal Khadi', 'Woven on manual pit-looms in rural Bengal using handspun organic cotton threads. Designed with dropped shoulders, mandarin collar, and Mother of Pearl fastenings for a timeless artisanal drape.', 'Handspun Khadi', 'Handspun Amber Khadi', 'Single Origin Handloom', 180, 'Edition 07 / 180', 'Core Line', 2900.00, 3300.00, true, false, true, true, 4.70, 28, '["100% handspun and handwoven certified organic cotton khadi","Natural unbleached finish with authentic raw yarn nep and slub variations","Concealed button placket with hand-stitched river shell buttons","Side slits at hem for fluid posture and ease"]'::jsonb, '["Gentle cold hand wash or machine cycle in laundry mesh bag","Line dry in partial shade to retain soft cotton hand"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Pleated Linen Trousers', 'pleated-linen-trousers-charcoal', 'Deep Charcoal • Double Pleat', 'High-rise relaxed tailoring crafted from heavyweight Belgian linen. Features forward double pleats, horn side tab adjusters, and a clean wide leg that pools softly over footwear.', 'Pure Linen', 'Belgian Organic Linen', 'Heavy Flax Twill', 290, 'Edition 05 / 100', 'Bestseller', 3400.00, 3900.00, true, true, false, true, 4.90, 31, '["290 GSM pure flax linen with enzyme wash for immediate broken-in softness","Traditional extended waistband with dual horn side-adjusters","Deep forward pleats and high-rise contour cut","Full interior taped waistband lining for stay-in-place comfort"]'::jsonb, '["Machine wash delicate in cold water or hand wash gently","Hang dry naturally away from intense direct sun"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Linen Camp Collar Shirt', 'linen-camp-collar-shirt-olive', 'Olive Drab • French Seams', 'An easy-wearing open-collar shirt in garment-washed Belgian linen. Finished with subtle single chest pocket, genuine corozo nut buttons, and French seams for effortless warm-weather wear.', 'Pure Linen', 'Belgian Organic Linen', 'Single Origin Handloom', 195, 'Edition 09 / 140', 'Bestseller', 2600.00, 2950.00, true, true, false, true, 4.90, 39, '["195 GSM fine Belgian organic flax with soft garment tumble finish","Cuban camp collar with button loop for versatile neck styling","Sustainably harvested corozo nut button fasteners","Straight hem with subtle side split vents for untucked drape"]'::jsonb, '["Gentle cold machine wash with similar colors","Warm iron while damp for polished finish"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Handwoven Tussar Silk Kurti', 'handwoven-tussar-silk-kurti', 'Amber Ochre • Heritage Weave', 'Crafted on tribal handlooms in Jharkhand with pure wild Tussar silk. Features a clean architectural neckline, delicate pin-tucks, and a rich, natural golden luster unachievable through chemical processes.', 'Raw Silk', 'Mulberry & Tussar Silk', 'Single Origin Handloom', 200, 'Edition 02 / 85', 'Low Batch (5 left)', 3600.00, 4100.00, false, false, true, true, 4.80, 14, '["100% wild Tussar organic silk cultivated through traditional forest sericulture","Handcrafted keyhole collar with loop mother-of-pearl button","Side slits lined with pure Mulberry silk binding","Breathable thermal qualities ideal for temperate and seasonal layering"]'::jsonb, '["Dry clean or cold sponge gently with silk-friendly cleanser","Keep away from direct humid dampness; store with cedar balls"]'::jsonb, 'Ready to ship via BlueDart air priority.'),
  ('d0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Atelier Silk-Linen Wrap Dress', 'atelier-silk-linen-wrap-dress', 'Terracotta Dusk • Tie Waist', 'An elegant kimono-inspired wrap silhouette spun from 60% Mulberry silk and 40% organic flax linen. Contoured with an asymmetric tie sash, deep pockets, and clean folded cuffs.', 'Silk-Linen Blend', 'Mulberry & Tussar Silk', 'Single Origin Handloom', 240, 'Edition 04 / 90', 'Limited Run (7 left)', 4600.00, 5200.00, false, false, true, true, 5.00, 22, '["Custom woven silk-linen union yarn combining silk luster with linen stability","Self-fabric belt ties through internal side eyelet for sculpted cinching","Deep in-seam pockets with reinforced bartack corners","Hand-finished blind hems"]'::jsonb, '["Professional dry clean recommended","Cool iron with pressing cloth"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Pleated Silk-Linen Trousers', 'pleated-silk-linen-trousers', 'Natural Flax • Relaxed Leg', 'Tailored trousers balancing structured drape with relaxed fluid movement. Cut from custom silk-linen yarn dyed in natural vegetable pigments, with horn button side tabs and deep slant pockets.', 'Silk-Linen Blend', 'Belgian Organic Linen', 'Heavy Flax Twill', 280, 'Edition 03 / 110', 'Core Line', 3800.00, 4200.00, false, false, false, true, 4.60, 16, '["Custom woven 280 GSM silk-flax blend milled in small batches","Front knife pleats giving ample ease around the hips","Reinforced crotch gusset for durability","Interior waist curtain lined in natural unbleached cotton"]'::jsonb, '["Gentle cold cycle or dry clean","Line dry in shade"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Organic Linen Camp Shirt', 'organic-linen-camp-shirt', 'Sandstone • Mother of Pearl', 'An airy short-sleeve camp shirt milled from unbleached European organic linen. Highlighted by genuine river pearl buttons, French seams, and a boxy relaxed cut designed for tropical days.', 'Pure Linen', 'Belgian Organic Linen', 'Single Origin Handloom', 190, 'Edition 06 / 130', 'Core Line', 2800.00, 3100.00, false, false, false, true, 4.80, 25, '["100% GOTS certified organic flax grown without synthetic pesticides","Loomed on heritage shuttles for a soft, breathable hand","Polished natural mother-of-pearl buttons sewn with shank reinforcement","Clean straight hemline with split vents"]'::jsonb, '["Machine wash gentle 30°C","Dry flat in shade; do not bleach"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'Cashmere-Merino Mockneck Sweater', 'cashmere-merino-mockneck-sweater', 'Oatmeal Heather • 7-Gauge Rib', 'An exceptionally soft, substantial 7-gauge mockneck sweater knit from a refined blend of cruelty-free Mongolian cashmere and extrafine Australian Merino wool. Engineered with fully fashioned raglan shoulders and dense ribbed cuffs.', 'Cashmere & Merino Wool', 'Mongolian Cashmere & Australian Merino', '7-Gauge Fully Fashioned Rib', 380, 'Edition 04 / 95', 'New Arrival', 4900.00, 5600.00, true, false, true, true, 4.90, 18, '["70% extrafine 19.5-micron Merino wool, 30% Grade-A Mongolian cashmere","Seamless fully fashioned raglan sleeve construction eliminating bulk under arms","Double-layered mockneck collar with shape-retention elastane core","Hand-linked collar, cuffs, and ribbed waistband"]'::jsonb, '["Hand wash cold with wool shampoo or professional eco dry clean","Dry flat on clean towel away from sunlight; fold, never hang"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Handspun Khadi Drawstring Trousers', 'handspun-khadi-drawstring-trousers', 'Natural Ecru • Organic Flax', 'Relaxed lounge trousers woven on manual wooden looms using pure handspun Bengal khadi cotton and flax. Features an elasticated drawstring waistband, deep side pockets, and an easy wide-leg silhouette.', 'Handspun Khadi', 'Handspun Amber Khadi', 'Single Origin Handloom', 260, 'Edition 05 / 110', 'Core Line', 3100.00, 3500.00, false, false, false, true, 4.80, 21, '["Pure unbleached handspun khadi spun on traditional amber charkhas","Natural unbleached finish with organic slub texture","Encased elastic waist with internal cotton herringbone drawstring","Twin back patch pockets and deep reinforced front pockets"]'::jsonb, '["Machine wash cold on gentle cycle","Line dry in shade"]'::jsonb, 'Complimentary air shipping across India.'),
  ('d0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Unstructured Linen Duster Coat', 'unstructured-belgian-linen-duster-coat', 'Raw Oatmeal • Horn Buttons', 'An unlined transitional duster coat cut from 340 GSM heavy Belgian flax linen. Tailored with dropped shoulders, oversized notch lapels, horn button fastenings, and deep welt pockets for effortless layering.', 'Pure Linen', 'Belgian Organic Linen', 'Heavy Flax Twill', 340, 'Edition 02 / 80', 'Curator''s Choice', 5800.00, 6500.00, true, false, true, true, 5.00, 17, '["340 GSM pure flax linen with crisp structural drape that softens gracefully with wear","Unlined construction with 100% cotton bound internal seams","Deep center back walking vent for graceful movement","Hand-sewn horn buttons and removable self-fabric tie belt"]'::jsonb, '["Dry clean recommended for structural longevity","Steam iron on medium setting"]'::jsonb, 'Complimentary air priority shipping with signature delivery.')
ON CONFLICT (tenant_id, slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured, is_bestseller = EXCLUDED.is_bestseller;

-- 6. PRODUCT COLLECTIONS MAPPING
INSERT INTO product_collections (product_id, collection_id)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000004')
ON CONFLICT (product_id, collection_id) DO NOTHING;

-- 7. PRODUCT VARIANTS
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price_override, is_active)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'LCJ-ESP-XS', 'XS', 'Espresso Brown', '#3D1B00', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'LCJ-ESP-S', 'S', 'Espresso Brown', '#3D1B00', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'LCJ-ESP-M', 'M', 'Espresso Brown', '#3D1B00', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'LCJ-ESP-L', 'L', 'Espresso Brown', '#3D1B00', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'LCJ-ESP-XL', 'XL', 'Espresso Brown', '#3D1B00', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'LCJ-CRM-M', 'M', 'Warm Cream', '#F4ECE1', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'LCJ-CRM-L', 'L', 'Warm Cream', '#F4ECE1', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', 'LCJ-OLV-M', 'M', 'Olive Drab', '#52523F', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000001', 'LCJ-OLV-L', 'L', 'Olive Drab', '#52523F', 4200.00, true),
  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002', 'RSMD-SND-XS', 'XS', 'Sand Dune', '#D6C2AC', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'RSMD-SND-S', 'S', 'Sand Dune', '#D6C2AC', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000002', 'RSMD-SND-M', 'M', 'Sand Dune', '#D6C2AC', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 'RSMD-SND-L', 'L', 'Sand Dune', '#D6C2AC', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000002', 'RSMD-OLV-S', 'S', 'Olive', '#60634E', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000002', 'RSMD-OLV-M', 'M', 'Olive', '#60634E', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000002', 'RSMD-CHR-S', 'S', 'Charcoal', '#2F2F2F', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000002', 'RSMD-CHR-M', 'M', 'Charcoal', '#2F2F2F', 3850.00, true),
  ('f0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000003', 'STB-ESP-XS', 'XS', 'Dark Espresso', '#2E1C12', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000003', 'STB-ESP-S', 'S', 'Dark Espresso', '#2E1C12', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000003', 'STB-ESP-M', 'M', 'Dark Espresso', '#2E1C12', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000003', 'STB-ESP-L', 'L', 'Dark Espresso', '#2E1C12', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000003', 'STB-ESP-XL', 'XL', 'Dark Espresso', '#2E1C12', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000003', 'STB-SLT-M', 'M', 'Charcoal Slate', '#353839', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000003', 'STB-SLT-L', 'L', 'Charcoal Slate', '#353839', 6200.00, true),
  ('f0000000-0000-0000-0000-000000000025', 'd0000000-0000-0000-0000-000000000004', 'OHT-ECR-XS', 'XS', 'Ecru Raw', '#F3EDE2', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000026', 'd0000000-0000-0000-0000-000000000004', 'OHT-ECR-S', 'S', 'Ecru Raw', '#F3EDE2', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000027', 'd0000000-0000-0000-0000-000000000004', 'OHT-ECR-M', 'M', 'Ecru Raw', '#F3EDE2', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000028', 'd0000000-0000-0000-0000-000000000004', 'OHT-ECR-L', 'L', 'Ecru Raw', '#F3EDE2', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000029', 'd0000000-0000-0000-0000-000000000004', 'OHT-ECR-XL', 'XL', 'Ecru Raw', '#F3EDE2', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000030', 'd0000000-0000-0000-0000-000000000004', 'OHT-IND-M', 'M', 'Indigo Wash', '#2C3E50', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000031', 'd0000000-0000-0000-0000-000000000004', 'OHT-IND-L', 'L', 'Indigo Wash', '#2C3E50', 2900.00, true),
  ('f0000000-0000-0000-0000-000000000032', 'd0000000-0000-0000-0000-000000000005', 'PLT-CHR-28', '28', 'Charcoal', '#2B2D2F', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000033', 'd0000000-0000-0000-0000-000000000005', 'PLT-CHR-30', '30', 'Charcoal', '#2B2D2F', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000034', 'd0000000-0000-0000-0000-000000000005', 'PLT-CHR-32', '32', 'Charcoal', '#2B2D2F', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000035', 'd0000000-0000-0000-0000-000000000005', 'PLT-CHR-34', '34', 'Charcoal', '#2B2D2F', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000036', 'd0000000-0000-0000-0000-000000000005', 'PLT-CHR-36', '36', 'Charcoal', '#2B2D2F', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000037', 'd0000000-0000-0000-0000-000000000005', 'PLT-TPE-32', '32', 'Warm Taupe', '#8B7D71', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000038', 'd0000000-0000-0000-0000-000000000005', 'PLT-TPE-34', '34', 'Warm Taupe', '#8B7D71', 3400.00, true),
  ('f0000000-0000-0000-0000-000000000039', 'd0000000-0000-0000-0000-000000000006', 'CCS-OLV-XS', 'XS', 'Olive Drab', '#52523F', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000040', 'd0000000-0000-0000-0000-000000000006', 'CCS-OLV-S', 'S', 'Olive Drab', '#52523F', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000041', 'd0000000-0000-0000-0000-000000000006', 'CCS-OLV-M', 'M', 'Olive Drab', '#52523F', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000042', 'd0000000-0000-0000-0000-000000000006', 'CCS-OLV-L', 'L', 'Olive Drab', '#52523F', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000043', 'd0000000-0000-0000-0000-000000000006', 'CCS-OLV-XL', 'XL', 'Olive Drab', '#52523F', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000006', 'CCS-CRM-M', 'M', 'Warm Cream', '#F4ECE1', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000045', 'd0000000-0000-0000-0000-000000000006', 'CCS-CRM-L', 'L', 'Warm Cream', '#F4ECE1', 2600.00, true),
  ('f0000000-0000-0000-0000-000000000046', 'd0000000-0000-0000-0000-000000000007', 'TSK-OCH-XS', 'XS', 'Amber Ochre', '#C68B59', 3600.00, true),
  ('f0000000-0000-0000-0000-000000000047', 'd0000000-0000-0000-0000-000000000007', 'TSK-OCH-S', 'S', 'Amber Ochre', '#C68B59', 3600.00, true),
  ('f0000000-0000-0000-0000-000000000048', 'd0000000-0000-0000-0000-000000000007', 'TSK-OCH-M', 'M', 'Amber Ochre', '#C68B59', 3600.00, true),
  ('f0000000-0000-0000-0000-000000000049', 'd0000000-0000-0000-0000-000000000007', 'TSK-OCH-L', 'L', 'Amber Ochre', '#C68B59', 3600.00, true),
  ('f0000000-0000-0000-0000-000000000050', 'd0000000-0000-0000-0000-000000000008', 'SLW-TER-XS', 'XS', 'Terracotta Dusk', '#B85D43', 4600.00, true),
  ('f0000000-0000-0000-0000-000000000051', 'd0000000-0000-0000-0000-000000000008', 'SLW-TER-S', 'S', 'Terracotta Dusk', '#B85D43', 4600.00, true),
  ('f0000000-0000-0000-0000-000000000052', 'd0000000-0000-0000-0000-000000000008', 'SLW-TER-M', 'M', 'Terracotta Dusk', '#B85D43', 4600.00, true),
  ('f0000000-0000-0000-0000-000000000053', 'd0000000-0000-0000-0000-000000000008', 'SLW-TER-L', 'L', 'Terracotta Dusk', '#B85D43', 4600.00, true),
  ('f0000000-0000-0000-0000-000000000054', 'd0000000-0000-0000-0000-000000000009', 'PSL-FLX-30', '30', 'Natural Flax', '#D8C7B5', 3800.00, true),
  ('f0000000-0000-0000-0000-000000000055', 'd0000000-0000-0000-0000-000000000009', 'PSL-FLX-32', '32', 'Natural Flax', '#D8C7B5', 3800.00, true),
  ('f0000000-0000-0000-0000-000000000056', 'd0000000-0000-0000-0000-000000000009', 'PSL-FLX-34', '34', 'Natural Flax', '#D8C7B5', 3800.00, true),
  ('f0000000-0000-0000-0000-000000000057', 'd0000000-0000-0000-0000-000000000010', 'OLC-SND-XS', 'XS', 'Sandstone', '#D6C7B2', 2800.00, true),
  ('f0000000-0000-0000-0000-000000000058', 'd0000000-0000-0000-0000-000000000010', 'OLC-SND-S', 'S', 'Sandstone', '#D6C7B2', 2800.00, true),
  ('f0000000-0000-0000-0000-000000000059', 'd0000000-0000-0000-0000-000000000010', 'OLC-SND-M', 'M', 'Sandstone', '#D6C7B2', 2800.00, true),
  ('f0000000-0000-0000-0000-000000000060', 'd0000000-0000-0000-0000-000000000010', 'OLC-SND-L', 'L', 'Sandstone', '#D6C7B2', 2800.00, true),
  ('f0000000-0000-0000-0000-000000000061', 'd0000000-0000-0000-0000-000000000010', 'OLC-SND-XL', 'XL', 'Sandstone', '#D6C7B2', 2800.00, true),
  ('f0000000-0000-0000-0000-000000000062', 'd0000000-0000-0000-0000-000000000011', 'CMM-OTM-XS', 'XS', 'Oatmeal Heather', '#D7CEBE', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000063', 'd0000000-0000-0000-0000-000000000011', 'CMM-OTM-S', 'S', 'Oatmeal Heather', '#D7CEBE', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000064', 'd0000000-0000-0000-0000-000000000011', 'CMM-OTM-M', 'M', 'Oatmeal Heather', '#D7CEBE', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000065', 'd0000000-0000-0000-0000-000000000011', 'CMM-OTM-L', 'L', 'Oatmeal Heather', '#D7CEBE', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000066', 'd0000000-0000-0000-0000-000000000011', 'CMM-OTM-XL', 'XL', 'Oatmeal Heather', '#D7CEBE', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000067', 'd0000000-0000-0000-0000-000000000011', 'CMM-CHR-M', 'M', 'Deep Charcoal', '#2E3033', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000068', 'd0000000-0000-0000-0000-000000000011', 'CMM-CHR-L', 'L', 'Deep Charcoal', '#2E3033', 4900.00, true),
  ('f0000000-0000-0000-0000-000000000069', 'd0000000-0000-0000-0000-000000000012', 'HKD-ECR-XS', 'XS', 'Natural Ecru', '#EDE6D6', 3100.00, true),
  ('f0000000-0000-0000-0000-000000000070', 'd0000000-0000-0000-0000-000000000012', 'HKD-ECR-S', 'S', 'Natural Ecru', '#EDE6D6', 3100.00, true),
  ('f0000000-0000-0000-0000-000000000071', 'd0000000-0000-0000-0000-000000000012', 'HKD-ECR-M', 'M', 'Natural Ecru', '#EDE6D6', 3100.00, true),
  ('f0000000-0000-0000-0000-000000000072', 'd0000000-0000-0000-0000-000000000012', 'HKD-ECR-L', 'L', 'Natural Ecru', '#EDE6D6', 3100.00, true),
  ('f0000000-0000-0000-0000-000000000073', 'd0000000-0000-0000-0000-000000000012', 'HKD-ECR-XL', 'XL', 'Natural Ecru', '#EDE6D6', 3100.00, true),
  ('f0000000-0000-0000-0000-000000000074', 'd0000000-0000-0000-0000-000000000013', 'ULD-OTM-XS', 'XS', 'Raw Oatmeal', '#D3C5B4', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000075', 'd0000000-0000-0000-0000-000000000013', 'ULD-OTM-S', 'S', 'Raw Oatmeal', '#D3C5B4', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000076', 'd0000000-0000-0000-0000-000000000013', 'ULD-OTM-M', 'M', 'Raw Oatmeal', '#D3C5B4', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000077', 'd0000000-0000-0000-0000-000000000013', 'ULD-OTM-L', 'L', 'Raw Oatmeal', '#D3C5B4', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000078', 'd0000000-0000-0000-0000-000000000013', 'ULD-OTM-XL', 'XL', 'Raw Oatmeal', '#D3C5B4', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000079', 'd0000000-0000-0000-0000-000000000013', 'ULD-WNT-M', 'M', 'Dark Walnut', '#3A2618', 5800.00, true),
  ('f0000000-0000-0000-0000-000000000080', 'd0000000-0000-0000-0000-000000000013', 'ULD-WNT-L', 'L', 'Dark Walnut', '#3A2618', 5800.00, true)
ON CONFLICT (sku) DO UPDATE SET size = EXCLUDED.size, color_name = EXCLUDED.color_name, color_hex = EXCLUDED.color_hex;

-- 8. INVENTORY ITEMS
INSERT INTO inventory_items (id, variant_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000013', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000014', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000015', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000016', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000017', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000018', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000019', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000020', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', 1, 0, 5),
  ('b0000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000023', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000024', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000025', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000026', 12, 0, 5),
  ('b0000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000027', 9, 0, 5),
  ('b0000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000028', 7, 0, 5),
  ('b0000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-000000000029', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000030', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000032', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000033', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000034', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000035', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000036', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000037', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000038', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000039', 'f0000000-0000-0000-0000-000000000039', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000040', 7, 0, 5),
  ('b0000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000041', 10, 0, 5),
  ('b0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000042', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000043', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000044', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000045', 'f0000000-0000-0000-0000-000000000045', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000046', 'f0000000-0000-0000-0000-000000000046', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000047', 'f0000000-0000-0000-0000-000000000047', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000048', 'f0000000-0000-0000-0000-000000000048', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000049', 'f0000000-0000-0000-0000-000000000049', 1, 0, 5),
  ('b0000000-0000-0000-0000-000000000050', 'f0000000-0000-0000-0000-000000000050', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000051', 'f0000000-0000-0000-0000-000000000051', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000052', 'f0000000-0000-0000-0000-000000000052', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000053', 'f0000000-0000-0000-0000-000000000053', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000054', 'f0000000-0000-0000-0000-000000000054', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000055', 'f0000000-0000-0000-0000-000000000055', 7, 0, 5),
  ('b0000000-0000-0000-0000-000000000056', 'f0000000-0000-0000-0000-000000000056', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000057', 'f0000000-0000-0000-0000-000000000057', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000058', 'f0000000-0000-0000-0000-000000000058', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000059', 'f0000000-0000-0000-0000-000000000059', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000060', 'f0000000-0000-0000-0000-000000000060', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000061', 'f0000000-0000-0000-0000-000000000061', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000062', 'f0000000-0000-0000-0000-000000000062', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000063', 'f0000000-0000-0000-0000-000000000063', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000064', 'f0000000-0000-0000-0000-000000000064', 8, 0, 5),
  ('b0000000-0000-0000-0000-000000000065', 'f0000000-0000-0000-0000-000000000065', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000066', 'f0000000-0000-0000-0000-000000000066', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000067', 'f0000000-0000-0000-0000-000000000067', 5, 0, 5),
  ('b0000000-0000-0000-0000-000000000068', 'f0000000-0000-0000-0000-000000000068', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000069', 'f0000000-0000-0000-0000-000000000069', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000070', 'f0000000-0000-0000-0000-000000000070', 7, 0, 5),
  ('b0000000-0000-0000-0000-000000000071', 'f0000000-0000-0000-0000-000000000071', 10, 0, 5),
  ('b0000000-0000-0000-0000-000000000072', 'f0000000-0000-0000-0000-000000000072', 6, 0, 5),
  ('b0000000-0000-0000-0000-000000000073', 'f0000000-0000-0000-0000-000000000073', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000074', 'f0000000-0000-0000-0000-000000000074', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000075', 'f0000000-0000-0000-0000-000000000075', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000076', 'f0000000-0000-0000-0000-000000000076', 4, 0, 5),
  ('b0000000-0000-0000-0000-000000000077', 'f0000000-0000-0000-0000-000000000077', 2, 0, 5),
  ('b0000000-0000-0000-0000-000000000078', 'f0000000-0000-0000-0000-000000000078', 1, 0, 5),
  ('b0000000-0000-0000-0000-000000000079', 'f0000000-0000-0000-0000-000000000079', 3, 0, 5),
  ('b0000000-0000-0000-0000-000000000080', 'f0000000-0000-0000-0000-000000000080', 2, 0, 5)
ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand;

-- 9. PRODUCT IMAGES
INSERT INTO product_images (id, product_id, url, alt_text, label, sort_order)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop', 'Front portrait of model wearing tailored espresso brown Belgian linen chore jacket', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop', 'Outdoor editorial portrait showcasing relaxed drape and collar construction', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1600&auto=format&fit=crop', 'Side profile silhouette view demonstrating structured shoulder seams', 'Back', 2),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1600&auto=format&fit=crop', 'Tactile macro shot of heavy Belgian flax weave texture and horn button', 'Detail', 3),
  ('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1600&auto=format&fit=crop', 'Studio catalog shot of woman wearing Raw Silk Midi Dress in Sand Dune', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop', 'Full length editorial portrait of woman in flowing raw silk midi dress', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1600&auto=format&fit=crop', 'Close-up movement view showing fluid silk drape and French seam finishes', 'Detail', 2),
  ('a0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop', 'Studio shot of dark espresso sculpted tailored blazer with peak lapels', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1600&auto=format&fit=crop', 'Editorial lookbook of tailored blazer worn over fine knitwear', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1600&auto=format&fit=crop', 'Side profile silhouette detailing structured floating canvas', 'Back', 2),
  ('a0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1600&auto=format&fit=crop', 'Studio shot of oversized ecru handspun khadi tunic with mandarin collar', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=1600&auto=format&fit=crop', 'Editorial lookbook of handspun tunic showing subtle organic slub texture', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1600&auto=format&fit=crop', 'Studio shot of model wearing charcoal pleated linen trousers', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1600&auto=format&fit=crop', 'Lookbook shot detailing the double pleats and side adjuster buckles', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1600&auto=format&fit=crop', 'Studio portrait of model in olive drab linen camp collar shirt', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop', 'Lookbook shot showing relaxed sleeve cut and corozo button placket', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1600&auto=format&fit=crop', 'Studio shot of amber ochre handwoven tussar silk kurti top', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1600&auto=format&fit=crop', 'Macro detail of natural golden tussar handloom texture and stitching', 'Detail', 1),
  ('a0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1600&auto=format&fit=crop', 'Studio portrait of model in terracotta dusk silk-linen wrap dress', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1600&auto=format&fit=crop', 'Movement lookbook shot showing wrap waist tie and flowing hemline', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1600&auto=format&fit=crop', 'Front view of natural flax pleated silk-linen trousers', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1600&auto=format&fit=crop', 'Editorial lookbook displaying tailoring profile and drape', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?q=80&w=1600&auto=format&fit=crop', 'Studio shot of sandstone organic linen short sleeve camp shirt', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1600&auto=format&fit=crop', 'Lookbook perspective showing chest pocket and camp collar detail', 'Lookbook', 1),
  ('a0000000-0000-0000-0000-000000000025', 'd0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1600&auto=format&fit=crop', 'Studio portrait of model wearing oatmeal heather cashmere-merino mockneck sweater', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000026', 'd0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1600&auto=format&fit=crop', 'Macro detail of the dense 7-gauge knit rib texture and yarn hand', 'Detail', 1),
  ('a0000000-0000-0000-0000-000000000027', 'd0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1600&auto=format&fit=crop', 'Studio shot of model wearing natural ecru handspun khadi drawstring trousers', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000028', 'd0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1600&auto=format&fit=crop', 'Macro view of drawstring tie waistband and organic cotton weave texture', 'Detail', 1),
  ('a0000000-0000-0000-0000-000000000029', 'd0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop', 'Studio editorial shot of full length raw oatmeal linen duster coat', 'Front', 0),
  ('a0000000-0000-0000-0000-000000000030', 'd0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop', 'Lookbook shot showing generous drape and horn button front placket', 'Lookbook', 1)
ON CONFLICT (id) DO NOTHING;

-- 10. PROMOTIONAL COUPONS
INSERT INTO coupons (id, tenant_id, code, discount_type, value, min_subtotal, max_uses, times_used, is_active)
VALUES
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'FESTIVE10', 'percentage', 10.00, 0.00, 1000, 0, true),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'WELCOME15', 'percentage', 15.00, 1500.00, 500, 0, true),
  ('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ATELIER20', 'percentage', 20.00, 3000.00, 250, 0, true)
ON CONFLICT (tenant_id, code) DO UPDATE SET value = EXCLUDED.value, is_active = EXCLUDED.is_active;
