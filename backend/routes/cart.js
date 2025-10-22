const router = require('express').Router({ mergeParams: true });
const verifyToken = require('../middlewares/auth.middleware');
const { listCart, addToCart, updateQuantity, updateSelected, deleteCartItem, clearCart } = require('../controllers/cart.controller');

router.use(verifyToken);

router.get('/', listCart);
router.post('/', addToCart);
router.put('/:id/quantity', updateQuantity);
router.put('/:id/selected', updateSelected);
router.delete('/:id', deleteCartItem);
router.delete('/', clearCart);

module.exports = router;
