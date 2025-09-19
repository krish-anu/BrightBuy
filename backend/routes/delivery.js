const { assignDeliveryStaff, updateDeliveryStatus, addCODPayment, getDeliveries } = require('../controllers/delivery.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require("../middlewares/role.middleware");
const ROLES = require('../roles');

const router = require('express').Router();

router.get('/',getDeliveries)

router.post('/:id/assignStaff',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),assignDeliveryStaff)
router.post('/:id/update', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DELIVERY), updateDeliveryStatus)
router.post('/:id/cod',verifyToken,authorizeRoles(ROLES.DELIVERY),addCODPayment)

module.exports = router;

