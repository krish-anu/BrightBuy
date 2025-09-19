const pool = require('../config/db'); 
const variantQueries = require('../queries/variantQueries');
const ApiError = require('../utils/ApiError');
const generateSKU = require('../utils/generateSKU');
const { query } = require('../config/db');
const productQueries = require('../queries/productQueries');
// const { handlePreOrdered } = require('../services/variant.service');

// Get all variants
const getVariants = async (req, res, next) => {
  try {
    const variants = await query(variantQueries.getAll);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get single variant
const getVariant = async (req, res, next) => {
  try {
    const rows = await query(variantQueries.getById, [req.params.id]);
    if (!rows) throw new ApiError('Variant not found', 404);
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
        if (!attr.id|| !attr.value) continue;

        // Insert attribute if not exists

        // Get attribute ID
        const [attribute] = await query(productQueries.getAttributeById, [attr.name]);
        if (!attribute.length)
          throw new ApiError('attribute not found',404)

        const attributeId=attribute[0].id

        // Insert variant option
        await query(productQueries.insertVariantOption, [
          variantId,
          attributeId,
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
    // handle preordered items - decrement
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
    const rows= await pool.query(variantQueries.getStock, [req.params.id]);
    if (!rows) throw new ApiError('Variant not found', 404);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// Search & filter variants
const searchAndFilterVariants = async (req, res, next) => {
  try {
    let { keyword, minPrice, maxPrice } = req.query;
    keyword = keyword || null;
    minPrice = minPrice !== undefined ? minPrice : null;
    maxPrice = maxPrice !== undefined ? maxPrice : null;
    const variants= await pool.query(variantQueries.searchAndFilter, [
      keyword, keyword, keyword, keyword,
      minPrice, minPrice,
      maxPrice, maxPrice
    ]);
    if (!variants) throw new ApiError('No matching variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get low stock variants
const getLowStockVariants = async (req, res, next) => {
  try {
    const qnt = req.query.qnt || 5;
    const variants = await pool.query(variantQueries.getLowStock, [qnt]);
    if (!variants) throw new ApiError('No low stock variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get popular variants
const getPopularVariants = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit )|| 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const [variants] = await pool.query(variantQueries.getPopular, [startDate]);
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