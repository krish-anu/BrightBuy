const pool = require('../config/db'); 
const variantQueries = require('../queries/variantQueries');
const ApiError = require('../utils/ApiError');
const generateSKU = require('../utils/generateSKU');

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
    const { productId, variantName, price, stockQnt } = req.body;
    if (!productId || !price || !variantName) throw new ApiError('Missing required fields', 400);

    const SKU = generateSKU('Product', variantName);

    const [result] = await pool.query(variantQueries.insert, [
      productId, variantName, SKU, price, stockQnt || 1, null
    ]);

    res.status(201).json({ success: true, data: { id: result.insertId, variantName, SKU, price, stockQnt } });
  } catch (error) {
    next(error);
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
};
