const { getCategories, getCategory, addCategory, updateCategory, deleteCategory, getCategoryVariantCount, getCategoryVariants, getCategoryHierarchy } = require('../controllers/category.controller');
const { route } = require('./variant');

const router = require('express').Router();

router.get('/hierarchy', getCategoryHierarchy);
router.get('/variant/:id', getCategoryVariants);
router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/', addCategory);

router.put('/:id', updateCategory);

router.delete('/:id', deleteCategory);


module.exports = router;