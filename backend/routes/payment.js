const { successPayment, cancelledPayment, checkPaymentStatus, getPayments, handleCODPayment } = require('../controllers/payment.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();

router.get('/success', successPayment)
router.get('/cancel', cancelledPayment)
router.get('/status', checkPaymentStatus)
router.get('/', verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),getPayments)

router.patch('/codPayment/:id',verifyToken,authorizeRoles(ROLES.DELIVERY),handleCODPayment)

module.exports = router;
 