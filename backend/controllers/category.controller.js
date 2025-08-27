const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

const db = require('../models');
const Category = db.category;
const Product = db.product;
const ProductVariant = db.productVariant;

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name'],
            include: [{ model: Category, as: 'parent', attributes: ['name', 'id'] },
            { model: Category, as: 'subcategories', attributes: ['name', 'id'] }],
            order: [['name', 'ASC']],
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            attributes: ['id', 'name'],
            include: [{ model: Category, as: 'parent', attributes: ['name', 'id'] },
            { model: Category, as: 'subcategories', attributes: ['name'] }]
        });
        if (!category) throw new ApiError('Category not found', 404);
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

const addCategory = async (req, res, next) => {
    try {
        const { name, parentId } = req.body;
        if (!name) throw new ApiError('Name is required', 400);

        const existing = await Category.findOne({ where: { name } });
        if (existing) throw new ApiError('Category exists', 409);

        if (parentId) {
            const parent = await Category.findByPk(parentId);
            if (!parent) throw new ApiError('Parent category not found', 404);
        }
        const category = await Category.create({ name, parentId });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

/**Get all variants of a category */
const getCategoryVariants = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) throw new ApiError('Category not found', 404);
        const productsWithVariants = await Product.findAll({
            include: [{
                model: Category,
                where: { [Op.or]: [{ id: req.params.id }, { parentId: req.params.id }] },
                attributes: [],
                through: { attributes: [] }
            }, { model: ProductVariant, attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt'] }],
            distinct: true,
        });
        const variants = productsWithVariants.flatMap(product => product.ProductVariants);
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) throw new ApiError('Category not found', 404);
        if (req.body.name) {
            const existing = await Category.findOne({ where: { name: req.body.name } });
            if (existing && existing.id !== category.id) throw new ApiError('Category exists', 409);
        }
        if (req.body.parentId) {
            if (req.body.parentId === category.id) throw new ApiError('Cannot be own parent', 400);
            const parent = await Category.findByPk(req.body.parentId);
            if (!parent) throw new ApiError('Parent category not found', 404);
        }
        await category.update(req.body);
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) throw new ApiError('Category not found', 404);
        await category.destroy();
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    getCategories,
    getCategory,
    addCategory,
    getCategoryVariants,
    updateCategory,
    deleteCategory,
};