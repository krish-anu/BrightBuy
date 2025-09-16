
const { getVariants, getVariant, addVariant, updateVariant, updateVariantStock, deleteVariant, searchAndFilterVariants,  getLowStockVariants, getPopularVariants} = require('../controllers/variant.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();

router.get('/popular',getPopularVariants)
router.get('/search', searchAndFilterVariants)
router.get('/lowStk', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN,ROLES.WAREHOUSE) ,getLowStockVariants)
router.get('/', getVariants)
router.get('/:id', getVariant);

router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addVariant);

router.put('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), updateVariant)
router.put('/stock/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.WAREHOUSE), updateVariantStock)

router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteVariant)

module.exports = router;