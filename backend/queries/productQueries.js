// Get all products with optional limit
const getAllProducts = `SELECT id, name, description, brand FROM products ORDER BY name ASC LIMIT ?`;

// Get product by ID
const getProductById = `SELECT id, name, description, brand FROM products WHERE id = ?`;

// Insert product
const insertProduct = `INSERT INTO products (name, description, brand) VALUES (?, ?, ?)`;

// Update product
const updateProduct = `UPDATE products SET name = ?, description = ?, brand = ? WHERE id = ?`;

// Delete product
const deleteProduct = `DELETE FROM products WHERE id = ?`;

// Count products
const countProducts = `SELECT COUNT(*) AS totalProducts FROM products`;

// Get product variants with attributes
const getVariantsByProduct = `
SELECT pv.id AS variantId, pv.variantName, pv.price, pv.stockQnt,
       va.id AS attributeId, va.name AS attributeName, pvo.value AS attributeValue
FROM product_variants pv
LEFT JOIN product_variant_options pvo ON pv.id = pvo.variantId
LEFT JOIN variant_attributes va ON pvo.attributeId = va.id
WHERE pv.productId = ?`;

// Count variants per product
const getProductVariantCount = `
SELECT p.id AS productId, p.name, COUNT(pv.id) AS count
FROM products p
LEFT JOIN product_variants pv ON pv.productId = p.id
GROUP BY p.id ORDER BY p.name ASC`;

// Check if product exists by name
const getProductByName = `SELECT * FROM products WHERE name = ?`;

// Insert variant
const insertVariant = `INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price) VALUES (?, ?, ?, ?, ?)`;

// Insert attribute if not exists
const insertAttributeIfNotExists = `INSERT IGNORE INTO variant_attributes (name) VALUES (?)`;

// Get attribute by name
const getAttributeByName = `SELECT * FROM variant_attributes WHERE name = ?`;

// Insert variant option
const insertVariantOption = `INSERT INTO product_variant_options (variantId, attributeId, value) VALUES (?, ?, ?)`;

// Get popular products
const getPopularProducts = `
SELECT p.id, p.name, p.brand, p.description, SUM(oi.quantity) AS soldQuantity
FROM products p
JOIN product_variants pv ON pv.productId = p.id
JOIN order_items oi ON oi.productVariantId = pv.id
GROUP BY p.id
ORDER BY soldQuantity DESC
LIMIT ?`;

module.exports = {
  getAllProducts,
  getProductById,
  insertProduct,
  updateProduct,
  deleteProduct,
  countProducts,
  getVariantsByProduct,
  getProductVariantCount,
  getProductByName,
  insertVariant,
  insertAttributeIfNotExists,
  getAttributeByName,
  insertVariantOption,
  getPopularProducts
};
