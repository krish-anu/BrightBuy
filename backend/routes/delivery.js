const { assignDeliveryStaff, updateDeliveryStatus, addCODPayment, getDeliveries, getDeliveryStaffAssignmentSummary, getEstimatedDeliveryDate } = require('../controllers/delivery.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require("../middlewares/role.middleware");
const ROLES = require('../roles');

const router = require('express').Router();

router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getDeliveries)

router.get('/deliveyDate',getEstimatedDeliveryDate)
// Delivery staff: get deliveries assigned to them
router.get('/assigned', verifyToken, authorizeRoles(ROLES.DELIVERY, ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/delivery.controller').getAssignedDeliveriesForStaff)

router.patch('/:id/assignStaff',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),assignDeliveryStaff)

// Update delivery status (delivery staff can update only their assigned deliveries)
router.patch('/:id/status', verifyToken, authorizeRoles(ROLES.DELIVERY, ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/delivery.controller').updateDeliveryStatusController)

// SuperAdmin: delivery staff assignment summary
router.get('/assignment/summary', verifyToken, authorizeRoles(ROLES.SUPERADMIN), getDeliveryStaffAssignmentSummary);

module.exports = router;

