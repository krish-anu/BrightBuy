const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');

// Admin signup - force role to 'Admin'
router.post('/signup', (req, res, next) => {
  try {
    req.body = req.body || {};
    req.body.role = 'Admin';
    return registerUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Admin login - signal admin login flow to controller
router.post('/login', (req, res, next) => {
  try {
    req.body = req.body || {};
    // this flag is checked in loginUser to ensure admin/staff accounts can't login via public flow
    req.body.adminLogin = true;
    return loginUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
