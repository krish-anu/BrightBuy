const { successPayment, cancelledPayment, checkPaymentStatus } = require('../controllers/payment.controller');

const router = require('express').Router();

router.get('/success', successPayment)
router.get('/cancel', cancelledPayment)
router.get('/status',checkPaymentStatus)

module.exports = router;
