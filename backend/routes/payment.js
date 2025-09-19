const { successPayment, cancelledPayment, checkPaymentStatus, getPayments } = require('../controllers/payment.controller');

const router = require('express').Router();

router.get('/success', successPayment)
router.get('/cancel', cancelledPayment)
router.get('/status', checkPaymentStatus)
router.get('/',getPayments)

module.exports = router;
