const { addOrder, getOrders, getOrder, cancelOrder, getOrderStatus } = require('../controllers/order.controller');

const router = require('express').Router();

router.get('/track/:id',getOrderStatus)
router.get('/', getOrders)
router.get('/:id', getOrder)

router.post('/', addOrder);

router.patch('/cancel/:id',cancelOrder)

module.exports = router;