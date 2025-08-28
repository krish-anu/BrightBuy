const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

const db = require('../models');
const Category = db.category;
const Product = db.product;
const ProductVariant = db.productVariant;

const getCategories = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const allCategories = await Category.findAll({
            include: [
                {model: Category,as: 'subcategories',attributes: ['id', 'name']},
                {model: Category,as: 'parent',attributes: ['id', 'name']}
            ],
            order: [
                ['name', 'ASC'],
                [{ model: Category, as: 'subcategories' }, 'name', 'ASC']
            ]
        });
        const categories = limit ? allCategories.slice(0, parseInt(limit)) : allCategories;

        res.status(200).json({success: true,data: categories});
    } catch (error) {
        next(error);
    }
};

const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            attributes: ['id', 'name'],
            include: [
                { model: Category, as: 'parent', attributes: ['id','name'] },
                { model: Category, as: 'subcategories', attributes: ['id','name'] },
            ]
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
        const variants = await ProductVariant.findAll({
            attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt'],
            include: [{
                model: Product,
                attributes: [],
                required: true,
                include: [{
                    model: Category,
                    attributes: [],
                    required: true,
                    where: { [Op.or]: [{ id: req.params.id }, { parentId: req.params.id }] }, through: { attributes: [] }
                }]
            },
            {
                model: db.variantAttribute,
                attributes: ['id', 'name'],
                through: { model: db.productVariantOption, attributes: ['value'] }
            }],
            order: [['variantName', 'ASC']]
        });
        if (variants.length === 0) {
            const categoryExists = await Category.findByPk(req.params.id, { attributes: ['id'] });
            if (!categoryExists) {
                throw new ApiError('Category not found', 404);
            }
        }

        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getCategoryHierarchy = async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { parentId: null }, attributes: ['id', 'name'],
            include: [{ model: Category, as: 'subcategories', attributes: ['id', 'name'], oreder: [['name', 'ASC']] }],
            order: [['name', 'ASC']]
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

const addProductsToCategory = async (req, res, next) => {
    try {
        const { categoryId, productIds } = req.body;
        if (!categoryId || !Array.isArray(productIds) || productIds.length === 0) {
            throw new ApiError('categoryId and productIds are required', 400);
        }
        const category = await Category.findByPk(categoryId);
        if (!category) throw new ApiError('Category not found', 404);
        const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
        if (products.length !== productIds.length)
            throw new ApiError('Some products not found', 404);
        await category.addProducts(products);
        res.status(200).json({ success: true, data: products });
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
        const category = await Category.findByPk(req.params.id, {
            include: [
                { model: db.category, as: 'subcategories' },
                { model: db.product, through: { attributes: [] } }]
        });
        if (!category) throw new ApiError('Category not found', 404);

        if (category.Products && category.Products.length > 0) {
            throw new ApiError('Cannot delete category with assigned products', 400);
        }
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
    addProductsToCategory,
    getCategoryHierarchy,
    updateCategory,
    deleteCategory,
};

