const { getProducts, getProduct, addProduct, updateProduct, deleteProduct, getProductVariantCount, getVariantsOfProduct, getProductCount } = require('../controllers/product.controller');

const router = require('express').Router();

router.get('/count', getProductCount);
router.get('/variant/count', getProductVariantCount);
router.get('/variant/:id', getVariantsOfProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);


router.post('/', addProduct)

router.put('/:id', updateProduct);

router.delete('/:id',deleteProduct)

module.exports = router;