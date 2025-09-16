// Get all categories
const getAll = `SELECT * FROM categories ORDER BY id ASC`;

// Get category by ID
const getById = `SELECT * FROM categories WHERE id = ?`;

// Get category by name
const getByName = `SELECT * FROM categories WHERE name = ?`;

// Get subcategories
const getSubcategories = `SELECT * FROM categories WHERE parentId = ?`;

// Insert category
const insert = `INSERT INTO categories (name, parentId) VALUES (?, ?)`;

// Update category
const update = `UPDATE categories SET name = ?, parentId = ? WHERE id = ?`;

// Delete category
const deleteCategory = `DELETE FROM categories WHERE id = ?`;

// Get products in category
const getProductsByCategory = `
  SELECT p.id, p.name FROM products p
  INNER JOIN product_categories pc ON pc.productId = p.id
  WHERE pc.categoryId = ?;
`;

// Get all variants of a category
const getCategoryVariants = `
  SELECT
    pv.id AS variantId,
    pv.SKU,
    pv.variantName,
    pv.price,
    pv.stockQnt,
    p.id AS productId,
    p.name AS productName,
    a.id AS attributeId,
    a.name AS attributeName,
    pa.value AS attributeValue
  FROM product_variants pv
  INNER JOIN products p ON p.id = pv.productId
  LEFT JOIN product_variant_attributes pa ON pa.variantId = pv.id
  LEFT JOIN attributes a ON a.id = pa.attributeId
  INNER JOIN product_categories pc ON pc.productId = p.id
  WHERE pc.categoryId = ?;
`;

// Get category hierarchy
const getHierarchy = `
  SELECT c1.id AS parentId, c1.name AS parentName, c2.id AS subId, c2.name AS subName
  FROM categories c1
  LEFT JOIN categories c2 ON c2.parentId = c1.id
  ORDER BY c1.id, c2.id;
`;

module.exports = {
  getAll,
  getById,
  getByName,
  getSubcategories,
  insert,
  update,
  delete: deleteCategory,
  getProductsByCategory,
  getCategoryVariants,
  getHierarchy
};
