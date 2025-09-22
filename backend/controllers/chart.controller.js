//  const { query, pool } = require('../config/db'); // use query helper
// const ApiError = require('../utils/ApiError');
// const chartQueries = require('../queries/chartQueries');

// // Get sales data for the last 7 days
// const getSalesLast7Days = async (req, res, next) => {
//   try {
//     const [rows] = await pool.query(chartQueries.salesLast7Days);
//     res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get top 5 products by sales in the last month
// const getTopProductsLastMonth = async (req, res, next) => {
//   try {
//     const [rows] = await pool.query(chartQueries.topProductsLastMonth);
//     res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get sales by category for the last month
// const getSalesByCategoryLastMonth = async (req, res, next) => {
//   try {
//     const [rows] = await pool.query(chartQueries.salesByCategoryLastMonth);
//     res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = {
//   getSalesLast7Days,
//   getTopProductsLastMonth,
//   getSalesByCategoryLastMonth,
// };
// controllers/chart.controller.js
 const { query, pool } = require('../config/db'); // use query helper
const chartQueries = require("../queries/chartQueries"); // adjust path if needed

// Get monthly sales data
const getSalesByMonth = async (req, res, next) => {
  try {
    const [rows] = await pool.query(chartQueries.getSalesByMonth);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};
const mainCategoryProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(chartQueries.mainCategoryProducts);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSalesByMonth,mainCategoryProducts
};
