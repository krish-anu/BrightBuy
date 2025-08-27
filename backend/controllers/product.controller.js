const ApiError = require('../utils/ApiError');
const {  fn, col } = require('sequelize');

const db = require('../models');
const Product = db.product;
const ProductVariant = db.productVariant;
const Category = db.category;

const getProducts = async (req, res, next) => {
    try {
        const products = await Product.findAll({
            attributes: ['id', 'name', 'description'],
            include: [{ model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] } }],
            order: [['createdAt', 'DESC']],
            distinct:true,
        });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            attributes: ['id', 'name', 'description'],
            include: [{ model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] } }]
        });
        if (!product) throw new ApiError('Product not found', 404);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const addProduct = async (req, res, next) => {
    try {
        const { name, description, categoryIds } = req.body;
        if (!name || !description) throw new ApiError('Name and description are required', 400);
        const existing = await Product.findOne({ where: { name } });
        if (existing) throw new ApiError('Product exists', 409);
        const product = await Product.create({ name,description});

        if (Array.isArray(categoryIds) && categoryIds.length) {
            const categories = await Category.findAll({ where: { id: categoryIds } });
            await product.setCategories(categories);
        }
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

/**Get variant count of each product */
const getProductVariantCount = async (req, res, next) => {
    try {
        const productCount = await Product.findAll({
            attributes: ['id', 'name', [fn('COUNT', col('ProductVariants.id')), 'count']],
            include: [{ model: ProductVariant, attributes: [] }],
            group: ['Product.id'],
            order:[['name','ASC']],
        })
        res.status(200).json({success:true,data:productCount})
    } catch (error) {
        next(error);
    }
};

const getVariantsOfProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id },
            attributes: ['name'],
            include: [{ model: ProductVariant, attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt'] }]
        });
        if (!product) throw new ApiError('Product not found', 404);
        const variants = product.ProductVariants;
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getProductCount = async (req, res, next) => {
    try {
        const count = await Product.count();
        res.status(200).json({ success: true, data: { totalProducts: count } });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) throw new ApiError('Product not found', 404);

        if (req.body.name) {
            const existing = await Product.findOne({ where: { name: req.body.name } });
            if (existing && existing.id !== product.id) throw new ApiError('Product name already exists', 409);
        }

        await product.update(req.body);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) throw new ApiError('Product not found', 404);

        await product.destroy();
        res.status(200).json({ success: true, message: 'Product deleted successfully' });

    } catch (error) {
        next(error);
    }
};



module.exports = {
    getProducts,
    getProduct,
    addProduct,
    getProductVariantCount,
    updateProduct,
    deleteProduct,
    getVariantsOfProduct,
    getProductCount
};