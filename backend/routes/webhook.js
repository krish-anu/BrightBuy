const express = require("express");
const router = express.Router();
const { stripeWebhook } = require('../controllers/webhook.controller');

// NOTE: remove express.raw() here; it’s already applied in app.js
router.post('/', stripeWebhook);

module.exports = router;
