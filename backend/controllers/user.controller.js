const { query } = require('../config/db'); // your raw query helper
const ApiError = require('../utils/ApiError');
const userQueries = require('../queries/userQueries');

// Get user delivery info
const getUserDeliveryInfo = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getById, [req.user.id]);
    if (rows.length === 0) throw new ApiError('User not found', 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// Update user info
const updateUserInfo = async (req, res, next) => {
  try {
    const { name, email, password, role, role_accepted, address, phone, cityId } = req.body;

    const rows = await query(userQueries.getById, [req.user.id]);
    if (rows.length === 0) throw new ApiError('User not found', 404);

    const user = rows[0];

    await query(userQueries.update, [
      name || user.name,
      email || user.email,
      password || user.password,
      role || user.role,
      role_accepted !== undefined ? role_accepted : user.role_accepted,
      address || user.address,
      phone || user.phone,
      cityId || user.cityId,
      req.user.id
    ]);

    const updatedRows = await query(userQueries.getById, [req.user.id]);
    res.status(200).json({ success: true, data: updatedRows[0] });
  } catch (err) {
    next(err);
  }
};

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getAll);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Get only delivery staff users (for admin assignment UI)
const getDeliveryStaff = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getDeliveryStaff);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Admin update user (different from updateUserInfo which updates current user)
const updateUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, address } = req.body;

    console.log('Update request body:', req.body);

    const rows = await query(userQueries.getById, [id]);
    if (rows.length === 0) throw new ApiError('User not found', 404);

    const user = rows[0];

    // Properly handle undefined values by converting them to existing values or null
    const updateParams = [
      name !== undefined ? name : user.name,
      email !== undefined ? email : user.email,
      role !== undefined ? role : user.role,
      user.role_accepted, // Keep existing role_accepted
      address !== undefined ? (address || null) : user.address,
      phone !== undefined ? (phone || null) : user.phone,
      user.cityId, // Keep existing cityId
      id
    ];

    console.log('Update parameters:', updateParams);

    await query(userQueries.updateAdmin, updateParams);

    const updatedRows = await query(userQueries.getById, [id]);
    res.status(200).json({ success: true, data: updatedRows[0] });
  } catch (err) {
    next(err);
  }
};

// Optional: Delete user
const deleteUser = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError('User not found', 404);

    await query(userQueries.delete, [req.params.id]);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserDeliveryInfo,
  updateUserInfo,
  getAllUsers,
  getDeliveryStaff,
  updateUserById,
  deleteUser
};
