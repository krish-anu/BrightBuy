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

const getProfile = async (req, res, next) => {
  try {
    const rows = await query(userQueries.findUserById, [req.user.id]);
    const user = rows && rows.length ? rows[0] : null;
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Address may be stored as JSON string or as an object depending on DB config.
    let address = {};
    try {
      if (user.address === null || user.address === undefined) {
        address = {};
      } else if (typeof user.address === 'string') {
        address = user.address ? JSON.parse(user.address) : {};
      } else if (typeof user.address === 'object') {
        address = user.address;
      } else {
        address = {};
      }
    } catch (e) {
      // If parsing fails, fall back to empty address and log for debugging
      console.error('Failed to parse user.address for user id', req.user.id, e);
      address = {};
    }

    res.status(200).json({
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      address,
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { phone, address } = req.body;
    const userId = req.user.id;

    // Ensure address is stored as a string in DB (JSON)
    const addressString = address && typeof address === 'object' ? JSON.stringify(address) : (address || null);

    await query(userQueries.updateProfile, [phone, addressString, userId]);

    const rows = await query(userQueries.findUserById, [userId]);
    const updatedUser = rows && rows.length ? rows[0] : null;

    if (!updatedUser) throw new ApiError('User not found after update', 404);

    // Safe parse like in getProfile
    let updatedAddress = {};
    try {
      if (updatedUser.address === null || updatedUser.address === undefined) {
        updatedAddress = {};
      } else if (typeof updatedUser.address === 'string') {
        updatedAddress = updatedUser.address ? JSON.parse(updatedUser.address) : {};
      } else if (typeof updatedUser.address === 'object') {
        updatedAddress = updatedUser.address;
      } else {
        updatedAddress = {};
      }
    } catch (e) {
      console.error('Failed to parse updatedUser.address for user id', userId, e);
      updatedAddress = {};
    }

    res.status(200).json({
      fullName: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedAddress,
    });
  } catch (err) {
    next(err);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    // Fetch existing hashed password
    const rows = await query(userQueries.getPasswordById, [userId]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    const bcrypt = require('bcryptjs');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await query(userQueries.updatePassword, [hashed, userId]);

    res.status(200).json({ message: 'Password changed successfully' });
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
  getProfile,
  updateProfile,
  changePassword,
  deleteUser
};
