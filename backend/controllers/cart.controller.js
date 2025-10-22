const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const cartQueries = require('../queries/cartQueries');

const listCart = async (req, res, next) => {
  try {
    const rows = await query(cartQueries.listByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { variantId, quantity = 1, selected = true, unitPrice = null } = req.body || {};
    console.log('addToCart called, body:', req.body, 'decoded user:', req.user);
    if (!variantId) throw new ApiError('variantId is required', 400);
    const uid = req.user && req.user.id;
    if (!uid) throw new ApiError('Unauthorized: missing user id', 401);

    // if an existing row for same user+variant exists, increment quantity
    const existing = await query(cartQueries.findByUserVariant, [uid, variantId]);
    if (existing && existing.length) {
      const row = existing[0];
      const newQty = Number(row.quantity || 0) + Number(quantity || 0);
      await query(cartQueries.updateQuantity, [newQty, row.id, uid]);
      console.log(`Updated existing cart row id=${row.id} for user=${uid} newQty=${newQty}`);
      const rows = await query(cartQueries.listByUser, [uid]);
      return res.status(200).json({ success: true, data: rows });
    }

    const result = await query(cartQueries.insert, [uid, variantId, quantity, selected ? 1 : 0, unitPrice]);
    console.log('Inserted cart row result:', result);
    const rows = await query(cartQueries.listByUser, [uid]);
    res.status(201).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body || {};
    if (!id) throw new ApiError('Invalid cart id', 400);
    if (quantity === undefined || quantity === null) throw new ApiError('quantity is required', 400);
    await query(cartQueries.updateQuantity, [quantity, id, req.user.id]);
    const rows = await query(cartQueries.listByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const updateSelected = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { selected } = req.body || {};
    if (!id) throw new ApiError('Invalid cart id', 400);
    if (selected === undefined || selected === null) throw new ApiError('selected is required', 400);
    await query(cartQueries.updateSelected, [selected ? 1 : 0, id, req.user.id]);
    const rows = await query(cartQueries.listByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Invalid cart id', 400);
    await query(cartQueries.delete, [id, req.user.id]);
    const rows = await query(cartQueries.listByUser, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await query(cartQueries.clearByUser, [req.user.id]);
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCart, addToCart, updateQuantity, updateSelected, deleteCartItem, clearCart };
