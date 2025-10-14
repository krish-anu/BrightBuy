// Get all products with variants, categories, price, stock, and status
const getAllProducts = `
SELECT 
    p.id,
    p.name,
    p.description,
    p.brand,
    COALESCE(
        JSON_ARRAYAGG(
            CASE 
                WHEN pv.id IS NOT NULL THEN
                    JSON_OBJECT(
                        'id', pv.id,
                        'variantName', pv.variantName,
                        'SKU', pv.SKU,
                        'price', pv.price,
                        'stockQnt', pv.stockQnt,
                        'imageURL', pv.imageURL,
                        'status', CASE 
                            WHEN pv.stockQnt > 10 THEN 'In Stock'
                            WHEN pv.stockQnt > 0 THEN 'Low Stock'
                            ELSE 'Out of Stock'
                        END
                    )
                ELSE NULL
            END
        ),
        JSON_ARRAY()
    ) AS ProductVariants,
    COALESCE(
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', c2.id,
                'name', c2.name
            )
        )
        FROM product_categories pc2
        LEFT JOIN categories c2 ON pc2.categoryId = c2.id
        WHERE pc2.productId = p.id
        ),
        JSON_ARRAY()
    ) AS Categories
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.productId
GROUP BY p.id, p.name, p.description, p.brand
ORDER BY p.name ASC
`;

// Get all products with pagination
const getAllProductsPaginated = `
SELECT 
    p.id,
    p.name,
    p.description,
    p.brand,
    COALESCE(
        JSON_ARRAYAGG(
            CASE 
                WHEN pv.id IS NOT NULL THEN
                    JSON_OBJECT(
                        'id', pv.id,
                        'variantName', pv.variantName,
                        'SKU', pv.SKU,
                        'price', pv.price,
                        'stockQnt', pv.stockQnt,
                        'imageURL', pv.imageURL,
                        'status', CASE 
                            WHEN pv.stockQnt > 10 THEN 'In Stock'
                            WHEN pv.stockQnt > 0 THEN 'Low Stock'
                            ELSE 'Out of Stock'
                        END
                    )
                ELSE NULL
            END
        ),
        JSON_ARRAY()
    ) AS ProductVariants,
    COALESCE(
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', c2.id,
                'name', c2.name
            )
        )
        FROM product_categories pc2
        LEFT JOIN categories c2 ON pc2.categoryId = c2.id
        WHERE pc2.productId = p.id
        ),
        JSON_ARRAY()
    ) AS Categories
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.productId
GROUP BY p.id, p.name, p.description, p.brand
ORDER BY p.name ASC
`;

// Get total count of products for pagination
const getTotalProductsCount = `
SELECT COUNT(*) as totalCount 
FROM products
`;

// Get complete inventory statistics (not affected by pagination)
const getInventoryStats = `
SELECT 
    COUNT(DISTINCT p.id) as totalProducts,
    COUNT(pv.id) as totalVariants,
    COALESCE(SUM(CASE WHEN pv.stockQnt <= 10 AND pv.stockQnt > 0 THEN 1 ELSE 0 END), 0) as lowStockItems,
    COALESCE(SUM(CASE WHEN pv.stockQnt = 0 THEN 1 ELSE 0 END), 0) as outOfStockItems,
    COALESCE(SUM(pv.price * pv.stockQnt), 0) as totalInventoryValue
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.productId
`;

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
SELECT
    pv.id AS variantId,
    pv.variantName,
    pv.price,
    pv.stockQnt,
    pv.SKU,
    pv.imageURL,
    JSON_ARRAYAGG(JSON_OBJECT(
        'attributeId', va.id,
        'attributeName', va.name,
        'attributeValue', pvo.value
    )) AS attributes
FROM product_variants pv
LEFT JOIN product_variant_options pvo ON pv.id = pvo.variantId
LEFT JOIN variant_attributes va ON pvo.attributeId = va.id
WHERE pv.productId = ?
GROUP BY pv.id, pv.variantName, pv.price, pv.stockQnt;
`;

// Count variants per product
const getProductVariantCount = `
SELECT p.id AS productId, p.name, COUNT(pv.id) AS count
FROM products p
LEFT JOIN product_variants pv ON pv.productId = p.id
GROUP BY p.id ORDER BY p.name ASC`;
// Check if product exists by name
const getProductByName = `SELECT * FROM products WHERE name = ?`;

// Insert variant (include imageURL to allow storing uploaded image link)
const insertVariant = `INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES (?, ?, ?, ?, ?, ?)`;

// Insert attribute if not exists
const insertAttributeIfNotExists = `INSERT IGNORE INTO variant_attributes (name) VALUES (?)`;

// Get attribute by name
const getAttributeById = `SELECT * FROM variant_attributes WHERE id = ?`;

// Insert variant option
const insertVariantOption = `INSERT INTO product_variant_options (variantId, attributeId, value) VALUES (?, ?, ?)`;

// Update variant image URL
const updateVariantImage = `UPDATE product_variants SET imageURL = ? WHERE id = ?`;

// Get popular products
const getPopularProducts = `
SELECT p.id, p.name, p.brand, p.description, SUM(oi.quantity) AS soldQuantity
FROM products p
JOIN product_variants pv ON pv.productId = p.id
JOIN order_items oi ON oi.variantId = pv.id
GROUP BY p.id
ORDER BY soldQuantity DESC
`;

const insertProductCategory = `
INSERT IGNORE INTO product_categories (productId, categoryId) VALUES (?, ?)
`;

const getCategoriesByProduct = `
SELECT c.id, c.name
FROM categories c
JOIN product_categories pc ON pc.categoryId = c.id
WHERE pc.productId = ?
`;

module.exports = {
  getAllProducts,
  getAllProductsPaginated,
  getTotalProductsCount,
  getInventoryStats,
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
    updateVariantImage,
  getAttributeById,
  insertVariantOption,
  getPopularProducts,
  insertProductCategory,
  getCategoriesByProduct
};
