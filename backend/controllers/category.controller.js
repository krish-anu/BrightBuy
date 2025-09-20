const { query, pool } = require('../config/db'); // use query helper
const categoryQueries = require('../queries/categoryQueries');
const ApiError = require('../utils/ApiError');

// Get all categories
const getCategories = async (req, res, next) => {
  try {
    const rows = await query(categoryQueries.getAll);
    const { limit } = req.query;
    const categories = limit ? rows.slice(0, parseInt(limit)) : rows;
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

// Get category by ID
const getCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    const rows = await query(`
      SELECT 
        c.id AS categoryId,
        c.name AS categoryName,
        c.parentId,
        va.id AS attributeId,
        va.name AS attributeName
      FROM categories c
      LEFT JOIN category_attributes cva ON c.id = cva.categoryId
      LEFT JOIN variant_attributes va ON cva.attributeId = va.id
      WHERE c.id = ?
    `, [categoryId]);

    if (!rows.length) throw new ApiError('Category not found', 404);

    // Group attributes
    const category = {
      categoryId: rows[0].categoryId,
      categoryName: rows[0].categoryName,
      parentId: rows[0].parentId,
      attributes: []
    };

    rows.forEach(row => {
      if (row.attributeId) {
        category.attributes.push({
          attributeId: row.attributeId,
          attributeName: row.attributeName
        });
      }
    });

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};


// Add new category
const addCategory = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, parentId, attributes } = req.body;

    if (!name) throw new ApiError('Name is required', 400);

    await connection.beginTransaction();

    const existing = await connection.query(categoryQueries.getByName, [name]);
    if (existing[0].length > 0) throw new ApiError('Category exists', 409);

    if (parentId) {
      const parentCheck = await connection.query(categoryQueries.getById, [parentId]);
      if (parentCheck[0].length === 0) throw new ApiError('Parent category not found', 404);
    }

    const [result] = await connection.query(categoryQueries.insert, [name, parentId || null]);
    const newCategoryId = result.insertId;

    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      const values = attributes.map(attrId => [newCategoryId, attrId]);
      await connection.query(categoryQueries.addCategoryAttributes, [values]);
    }

    await connection.commit();

    const [newCatRows] = await connection.query(categoryQueries.getById, [newCategoryId]);

    res.status(201).json({
      success: true,
      data: newCatRows
    });

  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// Update category
const updateCategory = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    const rows = await query(categoryQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError('Category not found', 404);

    if (name) {
      const existing = await query(categoryQueries.getByName, [name]);
      if (existing.length > 0 && existing[0].id !== parseInt(req.params.id))
        throw new ApiError('Category exists', 409);
    }

    if (parentId && parentId === parseInt(req.params.id))
      throw new ApiError('Cannot be own parent', 400);

    await query(categoryQueries.update, [name || rows[0].name, parentId || rows[0].parentId, req.params.id]);
    const updated = await query(categoryQueries.getById, [req.params.id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const rows = await query(categoryQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError('Category not found', 404);

    const subRows = await query(categoryQueries.getSubcategories, [req.params.id]);
    if (subRows.length > 0) throw new ApiError('Cannot delete category with subcategories', 400);

    const prodRows = await query(categoryQueries.getProductsByCategory, [req.params.id]);
    if (prodRows.length > 0) throw new ApiError('Cannot delete category with products', 400);

    await query(categoryQueries.delete, [req.params.id]);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get category variants
const getCategoryVariants = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const rows = await query(categoryQueries.getCategoryVariants, [categoryId]);

    if (rows.length === 0) {
      const catRows = await query(categoryQueries.getById, [categoryId]);
      if (catRows.length === 0) throw new ApiError('Category not found', 404);
    }

    const variantsMap = {};
    rows.forEach(row => {
      if (!variantsMap[row.variantId]) {
        variantsMap[row.variantId] = {
          id: row.variantId,
          SKU: row.SKU,
          variantName: row.variantName,
          price: row.price,
          stockQnt: row.stockQnt,
          product: { id: row.productId, name: row.productName },
          attributes: []
        };
      }
      if (row.attributeId) {
        variantsMap[row.variantId].attributes.push({
          id: row.attributeId,
          name: row.attributeName,
          value: row.attributeValue
        });
      }
    });

    res.status(200).json({ success: true, data: Object.values(variantsMap) });
  } catch (err) {
    next(err);
  }
};

// Add products to category
const addProductsToCategory = async (req, res, next) => {
  try {
    const { categoryId, productIds } = req.body;
    if (!categoryId || !Array.isArray(productIds) || productIds.length === 0) {
      throw new ApiError('categoryId and productIds are required', 400);
    }

    const catRows = await query(categoryQueries.getById, [categoryId]);
    if (catRows.length === 0) throw new ApiError('Category not found', 404);

    const prodRows = await query(
      `SELECT id FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );
    if (prodRows.length !== productIds.length)
      throw new ApiError('Some products not found', 404);

    const values = productIds.map(pid => [pid, categoryId]);
    await pool.query(
      `INSERT IGNORE INTO product_categories (productId, categoryId) VALUES ?`,
      [values]
    );

    res.status(200).json({ success: true, message: 'Products added to category' });
  } catch (err) {
    next(err);
  }
};

// Get category hierarchy
const getCategoryHierarchy = async (req, res, next) => {
  try {
    const rows = await query(categoryQueries.getHierarchy);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const addNewAttributes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attributeIds } = req.body;

    if (!Array.isArray(attributeIds) || attributeIds.length === 0) {
      throw new ApiError('attributeIds must be a non-empty array', 400);
    }

    // 1. Check category exists
    const rows = await query(categoryQueries.getById, [id]);
    if (rows.length === 0) throw new ApiError('Category not found', 404);

    // 2. Fetch attributes by IDs
    const attrRows = await query(categoryQueries.getAttributesByIds(attributeIds), attributeIds);
    if (attrRows.length === 0) throw new ApiError('No valid attributes found', 404);
    if (attrRows.length !== attributeIds.length) {
      throw new ApiError('Some attribute IDs are invalid', 400);
    }

    // 3. Insert relations into category_attributes table
    const values = attributeIds.map(attrId => [id, attrId]);
    const placeholders = values.map(() => '(?, ?)').join(',');
    const flattenedValues = values.flat();
    const sql = `INSERT IGNORE INTO category_attributes (categoryId, attributeId) VALUES ${ placeholders }`;
    await query(sql, flattenedValues);

    // 4. Fetch updated category with attributes
    const updatedRows = await query(categoryQueries.getCategoryWithAttributes, [id]);

    // 5. Group attributes under category
    const grouped = {};
    updatedRows.forEach(row => {
      if (!grouped[row.categoryId]) {
        grouped[row.categoryId] = {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          attributes: []
        };
      }
      if (row.attributeId) {
        grouped[row.categoryId].attributes.push({
          attributeId: row.attributeId,
          attributeName: row.attributeName
        });
      }
    });

    const response = Object.values(grouped);

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};



module.exports = {
    getCategories,
    getCategory,
    addCategory,
    getCategoryVariants,
    addProductsToCategory,
    getCategoryHierarchy,
    updateCategory,
    deleteCategory,
    addNewAttributes,

};
