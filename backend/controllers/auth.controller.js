const { query } = require('../config/db'); // use the query helper
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userQueries = require('../queries/userQueries');
const ApiError = require('../utils/ApiError');

// Register user
const registerUser = async (req, res, next) => {
  try {
  const { name, email, password, role, address, phone } = req.body;

    // Check if user already exists
    const existingUsers = await query(userQueries.getByEmail, [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const assignedRole = role || 'Customer';
    const autoApproved = ['Customer', 'SuperAdmin'].includes(assignedRole) ? 1 : 0;
    const userRes = await query(userQueries.insert, [
      name,
      email,
      hashedPassword,
      assignedRole,
      autoApproved,
      phone || null
    ]);
    const newUserId = userRes.insertId || userRes[0]?.insertId;

    // Optional address insert after user created
    if (newUserId && address && typeof address === 'object' && (address.line1 || address.cityId)) {
      const line1 = address.line1 || '';
      const line2 = address.line2 || null;
      const cityId = address.cityId ?? null;
      const postalCode = address.postalCode || null;
      const isDefault = 1; // first provided address, set default
      if (line1 && cityId !== null && cityId !== undefined) {
        await query(
          `INSERT INTO addresses (userId, line1, line2, cityId, postalCode, isDefault) VALUES (?,?,?,?,?,?)`,
          [newUserId, line1, line2, cityId, postalCode, isDefault]
        );
      }
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

// Login user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const rows = await query(userQueries.getByEmail, [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const stored = user.password || '';
    const looksHashed = typeof stored === 'string' && stored.startsWith('$2');
    let isMatch = false;
    if (looksHashed) {
      isMatch = await bcrypt.compare(password, stored);
    } else {
      // legacy plaintext path
      isMatch = password === stored;
      if (isMatch) {
        // migrate to bcrypt
        const migratedHash = await bcrypt.hash(password, 10);
        await query(userQueries.updatePassword, [migratedHash, user.id]);
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Require approval for non-customer roles (except SuperAdmin which is inherently approved)
      if (user.role !== 'Customer' && user.role !== 'SuperAdmin' && !user.role_accepted) {
      return res.status(403).json({ message: 'Account pending approval by SuperAdmin' });
    }

      // Prevent admin/staff accounts from logging in through the public/customer flow unless explicitly requested
      const adminRoles = ['Admin', 'SuperAdmin', 'WarehouseStaff', 'DeliveryStaff'];
      const adminLoginRequested = !!req.body?.adminLogin;
      if (adminRoles.includes(user.role) && !adminLoginRequested) {
        return res.status(403).json({ message: 'Please use the admin login page for admin/staff accounts' });
      }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // session valid for 10 minutes
    );

  res.status(200).json({ token, role: user.role, email: user.email, name: user.name, id: user.id, roleAccepted: !!user.role_accepted });
  } catch (err) {
    next(err);
  }
};

// Logout user
const logoutUser = async (req, res) => {
  res.status(200).json({ message: 'User logged out successfully' });
};

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await query(userQueries.getAll);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser, logoutUser, getAllUsers };
