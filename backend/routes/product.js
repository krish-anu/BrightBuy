const { getProducts, getProduct, addProduct, updateProduct, deleteProduct, getProductVariantCount, getVariantsOfProduct, getProductCount } = require('../controllers/product.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');

const router = require('express').Router();

router.get('/count', getProductCount);
router.get('/variant/count', getProductVariantCount);
router.get('/variant/:id', getVariantsOfProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);


router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addProduct)

router.put('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), updateProduct);

router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteProduct)

module.exports = router;