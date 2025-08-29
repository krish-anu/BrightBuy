const { stripeWebhook } = require('../controllers/webhook.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();
const express = require("express");

router.post('/', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
