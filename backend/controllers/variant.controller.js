const pool = require('../config/db'); 
const variantQueries = require('../queries/variantQueries');
const ApiError = require('../utils/ApiError');
const generateSKU = require('../utils/generateSKU');
const { query } = require('../config/db');
const productQueries = require('../queries/productQueries');

// Get all variants
const getVariants = async (req, res, next) => {
  try {
    const [variants] = await pool.query(variantQueries.getAll);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get single variant
const getVariant = async (req, res, next) => {
  try {
    const [rows] = await pool.query(variantQueries.getById, [req.params.id]);
    if (!rows.length) throw new ApiError('Variant not found', 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Add variant

const addVariant = async (req, res, next) => {
  try {
    const { productId, variantName, price, stockQnt, attributes } = req.body;

    if (!productId || !variantName || !price)
      throw new ApiError('Missing required fields', 400);

    console.log("Request Body:", req.body);

    // Generate SKU
    const SKU = generateSKU('Product', variantName);

    // Insert variant
    const result = await query(variantQueries.insert, [
      productId,
      variantName,
      SKU,
      price,
      stockQnt || 1,
      null, // imageURL, optional
    ]);

    const variantId = result.insertId;

    // Insert attributes if provided
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (!attr.name || !attr.value) continue;

        // Insert attribute if not exists
        await query(productQueries.insertAttributeIfNotExists, [attr.name]);

        // Get attribute ID
        const [attribute] = await query(productQueries.getAttributeByName, [attr.name]);

        // Insert variant option
        await query(productQueries.insertVariantOption, [
          variantId,
          attribute.id,
          attr.value
        ]);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: variantId,
        variantName,
        SKU,
        price,
        stockQnt: stockQnt || 1,
        attributes: attributes || []
      }
    });

  } catch (err) {
    next(err);
  }
};

// Update variant
const updateVariant = async (req, res, next) => {
  try {
    const { variantName, price, stockQnt } = req.body;
    await pool.query(variantQueries.update, [variantName, price, stockQnt, null, req.params.id]);
    res.status(200).json({ success: true, message: 'Variant updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Update variant stock
const updateVariantStock = async (req, res, next) => {
  try {
    const { qnt } = req.body;
    await pool.query(variantQueries.updateStock, [qnt, req.params.id]);
    res.status(200).json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete variant
const deleteVariant = async (req, res, next) => {
  try {
    await pool.query(variantQueries.delete, [req.params.id]);
    res.status(200).json({ success: true, message: 'Variant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get stock
const getStock = async (req, res, next) => {
  try {
    const [rows] = await pool.query(variantQueries.getStock, [req.params.id]);
    if (!rows.length) throw new ApiError('Variant not found', 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Search & filter variants
const searchAndFilterVariants = async (req, res, next) => {
  try {
    const { keyword, minPrice, maxPrice } = req.query;
    const [variants] = await pool.query(variantQueries.searchAndFilter, [
      keyword, keyword, keyword, keyword,
      minPrice, minPrice,
      maxPrice, maxPrice
    ]);
    if (!variants.length) throw new ApiError('No matching variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get low stock variants
const getLowStockVariants = async (req, res, next) => {
  try {
    const qnt = req.query.qnt || 5;
    const [variants] = await pool.query(variantQueries.getLowStock, [qnt]);
    if (!variants.length) throw new ApiError('No low stock variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get popular variants
const getPopularVariants = async (req, res, next) => {
  try {
    const limit = req.query.limit || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const [variants] = await pool.query(variantQueries.getPopular, [startDate, limit]);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVariants,
  getVariant,
  addVariant,
  updateVariant,
  updateVariantStock,
  deleteVariant,
  getStock,
  searchAndFilterVariants,
  getLowStockVariants,
  getPopularVariants
}