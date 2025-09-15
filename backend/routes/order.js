const { addOrder, getOrders, getOrder, cancelOrder, getOrderStatus, getUserOrders, getUserOrder, getCategoryWiseOrders,getTotalRevenue, updateOrderStatus } = require('../controllers/order.controller');

const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();
router.get("/totalRevenue", verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getTotalRevenue)

router.get('/category',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),getCategoryWiseOrders)
router.get('/user', verifyToken, authorizeRoles(ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN), getUserOrders);
router.get('/track/:id', verifyToken, authorizeRoles(ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN), getOrderStatus);
router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getOrders);
router.get('/:id', verifyToken, authorizeRoles( ROLES.USER,ROLES.ADMIN, ROLES.SUPERADMIN), getOrder);

router.post('/', verifyToken, authorizeRoles(ROLES.USER), addOrder);

router.patch('/cancel/:id', verifyToken, authorizeRoles(ROLES.USER), cancelOrder);

module.exports = router;