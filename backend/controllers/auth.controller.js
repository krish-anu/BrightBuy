const { query } = require('../config/db'); // use the query helper
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userQueries = require('../queries/userQueries');
const ApiError = require('../utils/ApiError');

// Register user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, address, phone, cityId } = req.body;

    // Check if user already exists
    const existingUsers = await query(userQueries.getByEmail, [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await query(userQueries.insert, [
      name,
      email,
      hashedPassword,
      role || 'user',
      false, // role_accepted default
      address || null,
      phone || null,
      cityId || null,
    ]);

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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, role: user.role, email: user.email });
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
