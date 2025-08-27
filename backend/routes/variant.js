const { getVariants, getVariant, addVariant, updateVariant, updateStock, deleteVariant, searchAndFilterVariants} = require('../controllers/variant.controller');

const router = require('express').Router();

router.get('/search',searchAndFilterVariants)
router.get('/', getVariants)
router.get('/:id', getVariant);

router.post('/', addVariant);

router.put('/:id', updateVariant)
router.put('/stock/:id', updateStock)

router.delete('/:id',deleteVariant)

module.exports = router;