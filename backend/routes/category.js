const { getCategories, getCategory, addCategory, updateCategory, deleteCategory, getCategoryVariantCount, getCategoryVariants } = require('../controllers/category.controller');

const router = require('express').Router();


router.get('/variant/:id', getCategoryVariants);
router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/', addCategory);

router.put('/:id', updateCategory);

router.delete('/:id', deleteCategory);


module.exports = router;