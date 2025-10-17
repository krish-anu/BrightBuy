const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const addressQueries = require('../queries/addressQueries');

const listAddresses = async (req, res, next) => {
  try {
    const rows = await query(addressQueries.getByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
  const { line1, line2, cityId, postalCode, isDefault } = req.body || {};
    if (!line1 || cityId === null || cityId === undefined) throw new ApiError('line1 and cityId are required', 400);

    // if marking new address default, clear previous defaults
    if (isDefault) {
      await query(addressQueries.clearDefault, [req.user.id]);
    }
  const result = await query(addressQueries.insert, [req.user.id, line1, line2 || null, cityId, cityId, postalCode || null, isDefault ? 1 : 0]);
    const id = result.insertId || result[0]?.insertId;
    const rows = await query(addressQueries.getByUser, [req.user.id]);
    res.status(201).json({ success: true, id, data: rows });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { line1, line2, cityId, postalCode, isDefault } = req.body || {};
    if (!id) throw new ApiError('Invalid address id', 400);
    if (!line1 || cityId === null || cityId === undefined) throw new ApiError('line1 and cityId are required', 400);

  await query(addressQueries.update, [line1, line2 || null, cityId, cityId, postalCode || null, id, req.user.id]);
    if (isDefault) {
      await query(addressQueries.clearDefault, [req.user.id]);
      await query(addressQueries.setDefault, [id, req.user.id]);
    }
    const rows = await query(addressQueries.getByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Invalid address id', 400);
    await query(addressQueries.delete, [id, req.user.id]);
    const rows = await query(addressQueries.getByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const makeDefault = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Invalid address id', 400);
    await query(addressQueries.clearDefault, [req.user.id]);
    await query(addressQueries.setDefault, [id, req.user.id]);
    const rows = await query(addressQueries.getByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAddresses, addAddress, updateAddress, deleteAddress, makeDefault };
