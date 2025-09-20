const { assignDeliveryStaff, updateDeliveryStatus, addCODPayment, getDeliveries } = require('../controllers/delivery.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require("../middlewares/role.middleware");
const ROLES = require('../roles');

const router = require('express').Router();

router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getDeliveries)

router.patch('/:id/assignStaff',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),assignDeliveryStaff)

module.exports = router;

