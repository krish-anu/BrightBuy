const { getCategories, getCategory, addCategory, updateCategory, deleteCategory, getCategoryVariantCount, getCategoryVariants, getCategoryHierarchy, addProductsToCategory } = require('../controllers/category.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require("../middlewares/role.middleware");
const ROLES = require('../roles');

const router = require('express').Router();


router.get('/hierarchy', getCategoryHierarchy);
router.get('/variant/:id', getCategoryVariants);
router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/addProductsCategory', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addProductsToCategory);
router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addCategory);

router.put('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN),updateCategory);

router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN),deleteCategory);


module.exports = router;
