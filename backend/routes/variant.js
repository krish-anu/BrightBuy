const { getVariants, getVariant, addVariant, updateVariant, updateStock, deleteVariant, searchAndFilterVariants, getPopularVariants, getLowStockVariants} = require('../controllers/variant.controller');

const router = require('express').Router();

router.get('/search', searchAndFilterVariants)
router.get('/popular', getPopularVariants)
router.get('/lowStk',getLowStockVariants)
router.get('/', getVariants)
router.get('/:id', getVariant);

router.post('/', addVariant);

router.put('/:id', updateVariant)
router.put('/stock/:id', updateStock)

router.delete('/:id',deleteVariant)

module.exports = router;