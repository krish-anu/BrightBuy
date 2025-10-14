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

    // Address: if provided as object with line1/city create or update an address row
    let addressId = user.addressId || null;
    if (address && typeof address === 'object' && (address.line1 || address.city)) {
      const line1 = address.line1 || '';
      const line2 = address.line2 || null;
      const city = address.city || '';
      const postalCode = address.postalCode || null;
      if (!line1 || !city) throw new ApiError('Address line1 and city required', 400);
      if (addressId) {
        await query(`UPDATE addresses SET line1=?, line2=?, city=?, postalCode=? WHERE id=?`, [line1, line2, city, postalCode, addressId]);
      } else {
        const result = await query(`INSERT INTO addresses (line1,line2,city,postalCode) VALUES (?,?,?,?)`, [line1, line2, city, postalCode]);
        addressId = result.insertId || result[0]?.insertId; // depending on driver shape
      }
    }

    await query(userQueries.update, [
      name || user.name,
      email || user.email,
      password || user.password,
      role || user.role,
      role_accepted !== undefined ? role_accepted : user.role_accepted,
      phone || user.phone,
      cityId || user.cityId,
      addressId,
      req.user.id
    ]);

    const updatedRows = await query(userQueries.getById, [req.user.id]);
    res.status(200).json({ success: true, data: updatedRows[0] });
  } catch (err) {
    next(err);
  }
};

// Get all users (SuperAdmin sees all; others only approved)
const getAllUsers = async (req, res, next) => {
  try {
    let rows;
    const requesterRole = req.user?.role;
    if (requesterRole === 'SuperAdmin') {
      rows = await query(userQueries.getAll);
    } else {
      rows = await query(userQueries.getAllApproved);
    }
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Approve user (SuperAdmin only)
const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query(userQueries.getById, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (rows[0].role === 'SuperAdmin') return res.status(400).json({ message: 'Cannot change SuperAdmin approval' });
    await query(`UPDATE users SET role_accepted = 1 WHERE id = ?`, [id]);
    const updated = await query(userQueries.getById, [id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (err) { next(err); }
};

// List pending users (role_accepted=0) for SuperAdmin
const getPendingUsers = async (req, res, next) => {
  try {
    const requesterRole = req.user?.role;
    if (requesterRole !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const rows = await query(userQueries.getPendingStaff);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
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
    // Handle address
    let addressId = user.addressId || null;
    if (address && typeof address === 'object' && (address.line1 || address.city)) {
      const line1 = address.line1 || '';
      const line2 = address.line2 || null;
      const city = address.city || '';
      const postalCode = address.postalCode || null;
      if (!line1 || !city) throw new ApiError('Address line1 and city required', 400);
      if (addressId) {
        await query(`UPDATE addresses SET line1=?, line2=?, city=?, postalCode=? WHERE id=?`, [line1, line2, city, postalCode, addressId]);
      } else {
        const result = await query(`INSERT INTO addresses (line1,line2,city,postalCode) VALUES (?,?,?,?)`, [line1, line2, city, postalCode]);
        addressId = result.insertId || result[0]?.insertId;
      }
    }

    const updateParams = [
      name !== undefined ? name : user.name,
      email !== undefined ? email : user.email,
      role !== undefined ? role : user.role,
      user.role_accepted,
      phone !== undefined ? (phone || null) : user.phone,
      user.cityId,
      addressId,
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
  deleteUser,
  approveUser
  , getPendingUsers
};
