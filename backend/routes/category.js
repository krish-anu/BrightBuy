const { getCategories, getCategory, addCategory, updateCategory, deleteCategory, getCategoryVariantCount, getCategoryVariants, getCategoryHierarchy, addProductsToCategory } = require('../controllers/category.controller');

const router = require('express').Router();

router.get('/hierarchy', getCategoryHierarchy);
router.get('/variant/:id', getCategoryVariants);
router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/addProducts', addProductsToCategory);
router.post('/', addCategory);

router.put('/:id', updateCategory);

router.delete('/:id', deleteCategory);


module.exports = router;