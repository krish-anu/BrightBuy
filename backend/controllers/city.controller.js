const { query, pool } = require('../config/db'); // use query helper
const cityQueries = require('../queries/cityQueries');
const ApiError = require('../utils/ApiError');

// Get all cities
const getCities = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.getAll);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Get city by ID
const getCity = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError("City not found", 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// Add new city
const addCity = async (req, res, next) => {
  try {
    if (!req.body.name) throw new ApiError('Name is required', 400);
    const result = await query(cityQueries.insert, [req.body.name, req.body.isMainCity || 0]);
    const newCity = await query(cityQueries.getById, [result.insertId]);
    res.status(201).json({ success: true, data: newCity[0] });
  } catch (err) {
    next(err);
  }
};

// Set a city as main
const addToMainCity = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError("City not found", 404);
    await query(cityQueries.setMain, [req.params.id]);
    const updated = await query(cityQueries.getById, [req.params.id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// Check if city is main
const isMainCity = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.isMain, [req.params.id]);
    if (rows.length === 0) throw new ApiError("City not found", 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// Get all main cities
const getMainCities = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.getMainCities);
    if (!rows.length) throw new ApiError('Main cities not found', 404);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Get all other cities
const getOtherCities = async (req, res, next) => {
  try {
    const rows = await query(cityQueries.getOtherCities);
    if (!rows.length) throw new ApiError('Other cities not found', 404);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCities,
  getCity,
  addCity,
  addToMainCity,
  isMainCity,
  getMainCities,
  getOtherCities
};
