const { successPayment, cancelledPayment } = require('../controllers/payment.controller');

const router = require('express').Router();

router.get('/success', successPayment)
router.get('/cancel',cancelledPayment)

module.exports = router;
