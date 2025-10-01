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

// Get single product with variants
const getProduct = async (req, res, next) => {
  try {
    const rows = await query(productQueries.getProductById, [req.params.id]);
    if (!rows.length) throw new ApiError('Product not found', 404);

    const variants = await query(productQueries.getVariantsByProduct, [req.params.id]);
    const product = rows[0];
    product.variants = variants;

    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

// Add new product with variants & attributes
const addProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, description, brand, attributes, stockQnt, price,categoryIds } = req.body;

    if (!name || !description || !attributes || !price )
      throw new ApiError('Name, description, price and attributes are required', 400);

    await connection.beginTransaction();

    const [existing] = await connection.query(productQueries.getProductByName, [name]);
    if (existing.length) throw new ApiError('Product exists', 409);

    const [productResult] = await connection.query(
      productQueries.insertProduct,
      [name, description, brand || null]
    );
    const productId = productResult.insertId;

    if (Array.isArray(categoryIds)) {
      for (const categoryId of categoryIds) {
        await connection.query(productQueries.insertProductCategory, [productId, categoryId]);
      }
    }

    const variantName = `${ name } ${ attributes.map(a => a.value).join(' ') }`;
    const SKU = generateSKU(name, variantName);

    const [variantResult] = await connection.query(productQueries.insertVariant, [
      productId,
      variantName,
      SKU,
      stockQnt || 1,
      price,
    ]);
    const variantId = variantResult.insertId;
    for (const attr of attributes) {
      if (!attr.id || !attr.value) continue;

      const [attribute] = await connection.query(productQueries.getAttributeById, [attr.id]);
      if (!attribute.length) throw new ApiError(`Attribute with id ${ attr.id } not found`, 404);

      const attributeId = attribute[0].id;
      await connection.query(productQueries.insertVariantOption, [
        variantId,
        attributeId,
        attr.value,
      ]);
    }

    await connection.commit();
    const [newProduct] = await connection.query(productQueries.getProductById, [productId]);

    res.status(201).json({ success: true, data: newProduct[0] });
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
    console.log('Pagination request received:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`Fetching products - page: ${page}, limit: ${limit}, offset: ${offset}`);

    // Get paginated products
    console.log('Executing paginated products query...');
    const products = await query(productQueries.getAllProductsPaginated, [limit, offset]);
    console.log(`Products fetched: ${products.length}`);
    
    // Get total count
    console.log('Executing total count query...');
    const countResult = await query(productQueries.getTotalProductsCount);
    console.log('Count result:', countResult);
    const totalCount = countResult[0]?.totalCount || 0;
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log('Pagination metadata:', {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      limit
    });

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
    console.error('Error in getProductsPaginated:', err);
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
  getPopularProduct
};
