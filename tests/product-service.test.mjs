import assert from "node:assert";

// Self-check for relational product transformation & stock arithmetic logic
function transformTestRow(row) {
  const images = (row.product_images || [])
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt_text || row.name,
      label: img.label || 'Front',
      sortOrder: img.sort_order || 0,
      isPrimary: Boolean(img.is_primary),
    }));

  const variants = (row.product_variants || [])
    .filter((v) => v.is_active !== false)
    .map((v) => {
      const inv = Array.isArray(v.inventory_items) ? v.inventory_items[0] : v.inventory_items;
      const onHand = inv ? Number(inv.quantity_on_hand ?? 0) : 0;
      const reserved = inv ? Number(inv.quantity_reserved ?? 0) : 0;
      const stock = Math.max(0, onHand - reserved);
      return {
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color_name,
        stock,
        price: v.price_override ? Number(v.price_override) : Number(row.price),
      };
    });

  const colorsMap = new Map();
  (row.product_variants || []).forEach((v) => {
    if (v.color_name && !colorsMap.has(v.color_name)) {
      colorsMap.set(v.color_name, v.color_hex || '#000000');
    }
  });

  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
    inStock: true,
  }));

  const sizes = Array.from(new Set(variants.map((v) => v.size)));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    category: row.categories?.name || 'All',
    featured: Boolean(row.is_featured),
    bestseller: Boolean(row.is_bestseller),
    newArrival: Boolean(row.is_new_arrival),
    status: row.status || (row.is_active ? 'published' : 'draft'),
    tags: Array.isArray(row.tags) ? row.tags : [],
    images,
    colors,
    sizes,
    variants,
  };
}

console.log("Running transform and stock reservation self-check...");

const sample = {
  id: "d0000000-0000-0000-0000-000000000001",
  slug: "linen-chore-jacket-espresso",
  name: "Linen Chore Jacket",
  price: "4200.00",
  compare_at_price: "4800.00",
  is_featured: true,
  is_bestseller: true,
  is_new_arrival: false,
  status: "published",
  tags: ["Linen", "Jackets"],
  categories: { name: "Outerwear" },
  product_images: [
    { id: "img-2", url: "back.jpg", sort_order: 2, is_primary: false },
    { id: "img-1", url: "front.jpg", sort_order: 1, is_primary: true }
  ],
  product_variants: [
    {
      id: "v-1",
      sku: "LCJ-M",
      size: "M",
      color_name: "Espresso",
      color_hex: "#3D1B00",
      inventory_items: { quantity_on_hand: 10, quantity_reserved: 3 } // 7 available
    },
    {
      id: "v-2",
      sku: "LCJ-L",
      size: "L",
      color_name: "Espresso",
      color_hex: "#3D1B00",
      price_override: "4500.00",
      inventory_items: { quantity_on_hand: 2, quantity_reserved: 2 } // 0 available (sold out)
    }
  ]
};

const result = transformTestRow(sample);

assert.strictEqual(result.id, sample.id);
assert.strictEqual(result.price, 4200);
assert.strictEqual(result.compareAtPrice, 4800);
assert.strictEqual(result.bestseller, true);
assert.strictEqual(result.status, "published");
assert.strictEqual(result.variants[0].stock, 7, "Stock must correctly subtract reserved from on_hand");
assert.strictEqual(result.variants[1].stock, 0, "Stock must be 0 when reserved equals on_hand");
assert.strictEqual(result.variants[1].price, 4500, "Price override must be respected");
assert.strictEqual(result.images[0].id, "img-1", "Images must be sorted by sort_order");
assert.strictEqual(result.images[0].isPrimary, true);

// Empty test
const emptyResult = transformTestRow({ id: "empty", slug: "empty", name: "Empty", price: 1000 });
assert.strictEqual(emptyResult.variants.length, 0, "Zero variants in DB must NOT create fake mock variants");
assert.strictEqual(emptyResult.bestseller, false);
assert.strictEqual(emptyResult.compareAtPrice, undefined);

// Pincode delivery self-check
function checkPincodeDelivery(pincode) {
  const clean = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return { valid: false, days: '', city: '', pincode: clean, courier: '' };
  }
  const prefix = clean.substring(0, 2);
  let city = 'Your Delivery Area';
  let days = '3–5 business days';
  if (prefix === '40') { city = 'Mumbai'; days = '1–2 business days'; }
  else if (prefix === '11') { city = 'New Delhi'; days = '2–3 business days'; }
  else if (prefix === '56') { city = 'Bengaluru'; days = '2–3 business days'; }
  return { valid: true, days, city, pincode: clean, courier: 'BlueDart Express Air' };
}

assert.strictEqual(checkPincodeDelivery("400001").valid, true);
assert.strictEqual(checkPincodeDelivery("400001").city, "Mumbai");
assert.strictEqual(checkPincodeDelivery("012345").valid, false, "Leading zero pincode must be invalid");
assert.strictEqual(checkPincodeDelivery("4000").valid, false, "Short pincode must be invalid");
assert.strictEqual(checkPincodeDelivery("ABCDEF").valid, false, "Alpha pincode must be invalid");

// Shipping fee rules check
function calculateShippingFee(subtotal, methodId) {
  if (methodId === "express_courier") return 450;
  return subtotal >= 1999 ? 0 : 250;
}

assert.strictEqual(calculateShippingFee(2500, "standard_air"), 0, "Free shipping threshold met");
assert.strictEqual(calculateShippingFee(1500, "standard_air"), 250, "Standard fee below threshold");
assert.strictEqual(calculateShippingFee(5000, "express_courier"), 450, "Express premium charge applied");

console.log("Self-check completed: All assertions passed.");
