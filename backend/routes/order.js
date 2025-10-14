const { REAL } = require('sequelize');
const { addOrder, getOrders, getOrder, cancelOrder, getOrderStatus, getUserOrders, getUserOrder, getCategoryWiseOrders,getTotalRevenue, updateOrderStatus, getTotalOrders,getStats} = require('../controllers/order.controller');

const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();
router.get("/totalRevenue", verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getTotalRevenue)
router.get("/totalOrders", verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getTotalOrders)
router.get('/stats',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),getStats)
// Reports
router.get('/reports/quarterly', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/order.controller').getQuarterlySales);
router.get('/reports/top-products', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/order.controller').getTopSellingProducts);
router.get('/reports/customer-summary', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/order.controller').getCustomerOrderSummary);
router.get('/reports/upcoming-deliveries', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DELIVERY), require('../controllers/order.controller').getUpcomingDeliveryEstimates);

router.get('/category',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN),getCategoryWiseOrders)
router.get('/user', verifyToken, authorizeRoles(ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN), getUserOrders);
router.get('/track/:id', verifyToken, authorizeRoles(ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN), getOrderStatus);
router.get('/assigned', verifyToken, authorizeRoles(ROLES.WAREHOUSE, ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/order.controller').getAssignedOrders);
router.get('/shipped', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), require('../controllers/order.controller').getShippedOrders);
router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getOrders);
router.get('/:id', verifyToken, authorizeRoles( ROLES.USER,ROLES.ADMIN, ROLES.SUPERADMIN), getOrder);

router.post('/', verifyToken, authorizeRoles(ROLES.USER), addOrder);

router.patch('/cancel/:id', verifyToken, authorizeRoles(ROLES.USER, ROLES.ADMIN), cancelOrder);
router.patch('/update/:id',verifyToken,authorizeRoles(ROLES.ADMIN,ROLES.SUPERADMIN,ROLES.DELIVERY),updateOrderStatus)



module.exports = router;