const { pool,query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const generateSKU = require('../utils/generateSKU');
const productQueries = require('../queries/productQueries');

// Get all products
const getProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
    const rows = await query(productQueries.getAllProducts);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Get all brands (from a dedicated brands table). If table doesn't exist, create it.
const getBrands = async (req, res, next) => {
  try {
    // ensure brands table exists
    await query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // fetch brands table entries
    const brandRows = await query(`SELECT id, name FROM brands ORDER BY name ASC`);

    // also fetch distinct brand values from products table (some older products may have brand text but not exist in brands table)
    const productBrandRows = await query(`SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != ''`);

    // merge and dedupe by name (case-insensitive), prefer brands table id when available
    const map = new Map();
    for (const r of brandRows) {
      if (!r || !r.name) continue;
      map.set(r.name.toString().toLowerCase(), { id: r.id, name: r.name });
    }
    for (const pr of productBrandRows) {
      const name = pr && pr.brand ? pr.brand.toString() : null;
      if (!name) continue;
      const key = name.toLowerCase();
      if (!map.has(key)) map.set(key, { id: null, name });
    }

    const merged = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.status(200).json({ success: true, data: merged });
  } catch (err) {
    next(err);
  }
};

// Create a brand (idempotent)
const createBrand = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.toString().trim()) throw new ApiError('Brand name is required', 400);
    const brandName = name.toString().trim();

    // ensure brands table exists
    await query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Insert if not exists
    await query(`INSERT IGNORE INTO brands (name) VALUES (?)`, [brandName]);
    const [rows] = await query(`SELECT id, name FROM brands WHERE name = ?`, [brandName]);
    res.status(201).json({ success: true, data: rows[0] || { name: brandName } });
  } catch (err) {
    next(err);
  }
};

// Get single product with variants
const getProduct = async (req, res, next) => {
  try {
    const rows = await query(productQueries.getProductById, [req.params.id]);
    if (!rows.length) throw new ApiError('Product not found', 404);

    const variants = await query(productQueries.getVariantsByProduct, [req.params.id]);
    const product = rows[0];
    product.variants = variants;
    const categories = await query(productQueries.getCategoriesByProduct, [req.params.id]);
    product.categories = categories;
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

// Add new product with variants & attributes
const addProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, description, brand, attributes, stockQnt, price, categoryIds, imageURL } = req.body;

    // defensive defaults and validation
    const attrs = Array.isArray(attributes) ? attributes : [];
    if (!name || !description || !price) throw new ApiError('Name, description and price are required', 400);

    await connection.beginTransaction();

    const [existing] = await connection.query(productQueries.getProductByName, [name]);
    let productId;
    if (existing.length) {
      // If a product with the same name exists, use its id and create a new variant for it
      productId = existing[0].id;
    } else {
      const [productResult] = await connection.query(
        productQueries.insertProduct,
        [name, description, brand || null]
      );
      productId = productResult.insertId;
    }

    if (Array.isArray(categoryIds)) {
      for (const categoryId of categoryIds) {
        // insertProductCategory is idempotent (INSERT IGNORE) so duplicates won't error
        await connection.query(productQueries.insertProductCategory, [productId, categoryId]);
      }
    }

  const variantName = `${ name } ${ attrs.map(a => a && a.value ? a.value : '').join(' ') }`;
    // Generate SKU and ensure uniqueness (retry a few times if collision occurs)
    let SKU;
    let variantResult;
    const maxSkuTries = 5;
    for (let attempt = 0; attempt < maxSkuTries; attempt++) {
      SKU = generateSKU(name, variantName);
      try {
        [variantResult] = await connection.query(productQueries.insertVariant, [
          productId,
          variantName,
          SKU,
          stockQnt || 1,
          price,
          imageURL || null,
        ]);
        break; // success
      } catch (err) {
        // If duplicate SKU (ER_DUP_ENTRY) then retry; otherwise rethrow
        if (err && err.code === 'ER_DUP_ENTRY') {
          console.warn(`SKU collision, retrying (${attempt + 1}/${maxSkuTries})`);
          if (attempt === maxSkuTries - 1) throw new ApiError('Failed to generate unique SKU, try again', 500);
          // else continue loop to generate a new SKU
        } else {
          throw err;
        }
      }
    }
    const variantId = variantResult.insertId;
    for (const attr of attrs) {
      if (!attr || !attr.id || !attr.value) continue;

      const attributeRows = await connection.query(productQueries.getAttributeById, [attr.id]);
      const attribute = Array.isArray(attributeRows) && attributeRows[0] ? attributeRows[0] : null;
      if (!attribute || attribute.length === 0) throw new ApiError(`Attribute with id ${ attr.id } not found`, 404);

      const attributeId = attribute[0].id || attribute[0].id;
      await connection.query(productQueries.insertVariantOption, [
        variantId,
        attributeId,
        attr.value,
      ]);
    }

  await connection.commit();
  const [newProduct] = await connection.query(productQueries.getProductById, [productId]);

  // Return created product and the newly created variant id so frontend can upload image with correct entityId
  res.status(201).json({ success: true, data: newProduct[0], variantId });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, brand } = req.body;
    const rows = await query(productQueries.getProductById, [req.params.id]);
    if (!rows.length) throw new ApiError('Product not found', 404);

    await query(productQueries.updateProduct, [
      name || rows[0].name,
      description || rows[0].description,
      brand || rows[0].brand,
      req.params.id
    ]);

    const updated = await query(productQueries.getProductById, [req.params.id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (err) { next(err); }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const rows = await query(productQueries.getProductById, [req.params.id]);
    if (!rows.length) throw new ApiError('Product not found', 404);
    const variantRows = await query(productQueries.getVariantsByProduct, [req.params.id]);
    if (variantRows.length > 0) {
      throw new ApiError('Cannot delete a product with variants', 400);
    }
    await query(productQueries.deleteProduct, [req.params.id]);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) { next(err); }
};

// Get variant count of each product
const getProductVariantCount = async (req, res, next) => {
  try {
    const rows = await query(productQueries.getProductVariantCount);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Get variants of a product
const getVariantsOfProduct = async (req, res, next) => {
  try {
    const variants = await query(productQueries.getVariantsByProduct, [req.params.productId]);
    if (!variants.length) throw new ApiError('Variants not found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (err) { next(err); }
};

// Get total product count
const getProductCount = async (req, res, next) => {
  try {
    const [count] = await query(productQueries.countProducts);
    res.status(200).json({ success: true, data: count });
  } catch (err) { next(err); }
};

// Get all products with pagination
const getProductsPaginated = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;


    // Build query dynamically
    let sql = `
      SELECT 
          pv.id AS variantId,
          pv.variantName,
          pv.SKU,
          pv.price,
          pv.stockQnt,
          pv.imageURL,
          CASE 
              WHEN pv.stockQnt > 10 THEN 'In Stock'
              WHEN pv.stockQnt > 0 THEN 'Low Stock'
              ELSE 'Out of Stock'
          END AS status,
          p.id AS productId,
          p.name AS productName,
          p.description AS productDescription,
          p.brand AS productBrand,
          COALESCE(
              (
                  SELECT JSON_ARRAYAGG(
                      JSON_OBJECT('id', c.id, 'name', c.name)
                  )
                  FROM product_categories pc
                  INNER JOIN categories c ON pc.categoryId = c.id
                  WHERE pc.productId = p.id
              ),
              JSON_ARRAY()
          ) AS Categories
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.productId
    `;

    const params = [];

    if (categoryId) {
      sql += `
        INNER JOIN product_categories pc ON p.id = pc.productId
        WHERE pc.categoryId = ?
      `;
      params.push(categoryId);
    }

    sql += `
      ORDER BY p.name ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const products = await query(sql, params);

    // Count query for pagination
    let countSql = `
      SELECT COUNT(DISTINCT p.id) AS totalCount
      FROM products p
    `;
    const countParams = [];

    if (categoryId) {
      countSql += `
        INNER JOIN product_categories pc ON p.id = pc.productId
        WHERE pc.categoryId = ?
      `;
      countParams.push(categoryId);
    }

    const countResult = await query(countSql, countParams);
    const totalCount = countResult[0]?.totalCount || 0;

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
  
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (err) {
    console.error("Error in getProductsPaginated:", err);
    next(err);
  }
};



// Get inventory statistics (not affected by pagination)
const getInventoryStats = async (req, res, next) => {
  try {
    console.log('Fetching inventory statistics...');
    const [stats] = await query(productQueries.getInventoryStats);
    console.log('Inventory stats result:', stats);
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts: stats.totalProducts || 0,
        totalVariants: stats.totalVariants || 0,
        lowStockItems: stats.lowStockItems || 0,
        outOfStockItems: stats.outOfStockItems || 0,
        totalInventoryValue: parseFloat(stats.totalInventoryValue) || 0
      }
    });
  } catch (err) {
    console.error('Error in getInventoryStats:', err);
    next(err);
  }
};

// Get popular products
const getPopularProduct = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const rows = await query(productQueries.getPopularProducts, [limit]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = {
  getProducts,
  getProductsPaginated,
  getInventoryStats,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductVariantCount,
  getVariantsOfProduct,
  getProductCount,
  getPopularProduct,
  getBrands,
  createBrand
};
 


