const { query } = require("../config/db"); // your raw query helper
const ApiError = require("../utils/ApiError");
const userQueries = require("../queries/userQueries");

// Get user delivery info
const getUserDeliveryInfo = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getById, [req.user.id]);
    if (rows.length === 0) throw new ApiError("User not found", 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// helper to normalize string-ish inputs; empty strings -> null
const _sanitizeStr = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

// Update user info
const updateUserInfo = async (req, res, next) => {
  try {
    const { name, email, password, role, role_accepted, address, phone } = req.body;

    const rows = await query(userQueries.getById, [req.user.id]);
    if (!rows.length) throw new ApiError("User not found", 404);
    const user = rows[0];

    let addressId = user.addressId || null;
    if (address && typeof address === "object") {
      const sLine1 = _sanitizeStr(address.line1);
      const sLine2 = _sanitizeStr(address.line2);
      const sPostal = _sanitizeStr(address.postalCode);
      const cityId = address.cityId ?? null;

      if (addressId) {
        const currentRows = await query(
          `SELECT line1, line2, cityId, postalCode FROM addresses WHERE id = ?`,
          [addressId]
        );
        const current = currentRows[0] || {};
        const newLine1 = sLine1 !== null ? sLine1 : current.line1 || null;
        const newLine2 = sLine2 !== null ? sLine2 : current.line2 || null;
        const newCityId = cityId !== null && cityId !== undefined ? cityId : (current.cityId ?? null);
        const newPostal = sPostal !== null ? sPostal : current.postalCode || null;
        await query(
          `UPDATE addresses SET line1=?, line2=?, cityId=?, postalCode=? WHERE id=?`,
          [newLine1, newLine2, newCityId, newPostal, addressId]
        );
      } else {
        const hasAny = [sLine1, sLine2, cityId, sPostal].some((v) => v !== null);
        if (hasAny) {
          if (!sLine1 || cityId === null || cityId === undefined) {
            throw new ApiError("Address line1 and cityId are required", 400);
          }
          const result = await query(
            `INSERT INTO addresses (line1,line2,cityId,postalCode) VALUES (?,?,?,?)`,
            [sLine1, sLine2, cityId, sPostal]
          );
          addressId = result.insertId || result[0]?.insertId;
        }
      }
    }

    await query(userQueries.update, [
      name || user.name,
      email || user.email,
      password || user.password,
      role || user.role,
      role_accepted !== undefined ? role_accepted : user.role_accepted,
      phone || user.phone,
      addressId,
      req.user.id,
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
    if (requesterRole === "SuperAdmin") {
      rows = await query(userQueries.getAll);
    } else {
      rows = await query(userQueries.getAllApproved);
    }
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Approve user (SuperAdmin only)
const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query(userQueries.getById, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    if (rows[0].role === "SuperAdmin")
      return res
        .status(400)
        .json({ message: "Cannot change SuperAdmin approval" });
    await query(`UPDATE users SET role_accepted = 1 WHERE id = ?`, [id]);
    const updated = await query(userQueries.getById, [id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// List pending users (role_accepted=0) for SuperAdmin
const getPendingUsers = async (req, res, next) => {
  try {
    const requesterRole = req.user?.role;
    if (requesterRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const rows = await query(userQueries.getPendingStaff);
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

    console.log("Update request body:", req.body);

    const rows = await query(userQueries.getById, [id]);
    if (rows.length === 0) throw new ApiError("User not found", 404);

    const user = rows[0];

    // Properly handle undefined values by converting them to existing values or null
    // Handle address (allow partial updates)
    let addressId = user.addressId || null;
    if (address && typeof address === "object") {
      const sLine1 = _sanitizeStr(address.line1);
      const sLine2 = _sanitizeStr(address.line2);
      const sPostal = _sanitizeStr(address.postalCode);
      const cityId = address.cityId ?? null;

      if (addressId) {
        const currentRows = await query(
          `SELECT line1, line2, cityId, postalCode FROM addresses WHERE id = ?`,
          [addressId]
        );
        const current = currentRows[0] || {};
        const newLine1 = sLine1 !== null ? sLine1 : current.line1 || null;
        const newLine2 = sLine2 !== null ? sLine2 : current.line2 || null;
        const newCityId = cityId !== null && cityId !== undefined ? cityId : (current.cityId ?? null);
        const newPostal = sPostal !== null ? sPostal : current.postalCode || null;
        await query(
          `UPDATE addresses SET line1=?, line2=?, cityId=?, postalCode=? WHERE id=?`,
          [newLine1, newLine2, newCityId, newPostal, addressId]
        );
      } else {
        const hasAny = [sLine1, sLine2, cityId, sPostal].some((v) => v !== null);
        if (hasAny) {
          if (!sLine1 || cityId === null || cityId === undefined) {
            throw new ApiError("Address line1 and cityId are required", 400);
          }
          const result = await query(
            `INSERT INTO addresses (line1,line2,cityId,postalCode) VALUES (?,?,?,?)`,
            [sLine1, sLine2, cityId, sPostal]
          );
          addressId = result.insertId || result[0]?.insertId;
        }
      }
    }

    const updateParams = [
      name !== undefined ? name : user.name,
      email !== undefined ? email : user.email,
      role !== undefined ? role : user.role,
      user.role_accepted,
      phone !== undefined ? phone || null : user.phone,
      addressId,
      id,
    ];

    console.log("Update parameters:", updateParams);

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

    const address = {
      line1: user.addressLine1 || "",
      line2: user.addressLine2 || "",
      cityId: user.addressCityId ?? null,
      postalCode: user.addressPostalCode || "",
    };

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

    // Fetch current user to get existing addressId
    const existingRows = await query(userQueries.getById, [userId]);
    if (!existingRows || existingRows.length === 0) {
      throw new ApiError("User not found", 404);
    }
    const existing = existingRows[0];
    let addressId = existing.addressId || null;

    if (address && typeof address === "object") {
      const sLine1 = _sanitizeStr(address.line1);
      const sLine2 = _sanitizeStr(address.line2);
      const sPostal = _sanitizeStr(address.postalCode);
      const cityId = address.cityId ?? null;

      if (addressId) {
        const currentRows = await query(
          `SELECT line1, line2, cityId, postalCode FROM addresses WHERE id = ?`,
          [addressId]
        );
        const current = currentRows[0] || {};
        const newLine1 = sLine1 !== null ? sLine1 : current.line1 || null;
        const newLine2 = sLine2 !== null ? sLine2 : current.line2 || null;
        const newCityId = cityId !== null && cityId !== undefined ? cityId : (current.cityId ?? null);
        const newPostal = sPostal !== null ? sPostal : current.postalCode || null;
        await query(
          `UPDATE addresses SET line1=?, line2=?, cityId=?, postalCode=? WHERE id=?`,
          [newLine1, newLine2, newCityId, newPostal, addressId]
        );
      } else {
        const hasAny = [sLine1, sLine2, cityId, sPostal].some((v) => v !== null);
        if (hasAny) {
          if (!sLine1 || cityId === null || cityId === undefined) {
            throw new ApiError("Address line1 and cityId are required", 400);
          }
          const result = await query(
            `INSERT INTO addresses (line1,line2,cityId,postalCode) VALUES (?,?,?,?)`,
            [sLine1, sLine2, cityId, sPostal]
          );
          addressId = result.insertId || result[0]?.insertId;
        }
      }
    }

    await query(userQueries.updateProfile, [phone || null, addressId, userId]);

    const rows = await query(userQueries.findUserById, [userId]);
    const updated = rows && rows.length ? rows[0] : null;
    if (!updated) throw new ApiError("User not found after update", 404);

    const updatedAddress = {
      line1: updated.addressLine1 || "",
      line2: updated.addressLine2 || "",
      cityId: updated.addressCityId ?? null,
      postalCode: updated.addressPostalCode || "",
    };

    res.status(200).json({
      fullName: updated.name,
      email: updated.email,
      phone: updated.phone,
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
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword are required" });
    }

    // Fetch existing password (may be hashed or legacy plaintext)
    const rows = await query(userQueries.getPasswordById, [userId]);
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const bcrypt = require("bcryptjs");

    const stored = user.password || "";
    const looksHashed = typeof stored === "string" && stored.startsWith("$2");

    let valid = false;
    if (looksHashed) {
      // Normal path: bcrypt compare
      valid = await bcrypt.compare(currentPassword, stored);
    } else {
      // Legacy path: stored as plaintext — compare directly, then migrate to bcrypt
      valid = currentPassword === stored;
    }

    if (!valid) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect" });
    }

    // Always store new password hashed
    const hashed = await bcrypt.hash(newPassword, 10);
    await query(userQueries.updatePassword, [hashed, userId]);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

// Optional: Delete user
const deleteUser = async (req, res, next) => {
  try {
    const rows = await query(userQueries.getById, [req.params.id]);
    if (rows.length === 0) throw new ApiError("User not found", 404);

    await query(userQueries.delete, [req.params.id]);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
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
  deleteUser,
  approveUser,
  getPendingUsers,
};
