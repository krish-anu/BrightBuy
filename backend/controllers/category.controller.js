const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const db = require('../models');
const { fetchAttributes, fetchCategory, fetchParent } = require('../services/category.service');

const { category: Category,
    product: Product,
    productVariant: ProductVariant,
    categoryAttribute: CategoryAttribute,
    variantAttribute: VariantAttribute } = db;

/* Get all categories with attributes */
const getCategories = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const categories = await Category.findAll({
            order: [['name', 'ASC']],
            include: [{ model: VariantAttribute, attributes: ['id', 'name'], through: { attributes: [] } }],
            limit: limit ? parseInt(limit) : undefined,
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

/* Get a category by id with parent and subcategories */
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            attributes: ['id', 'name'],
            include: [
                { model: Category, as: 'parent', attributes: ['id', 'name'] },
                { model: Category, as: 'subcategories', attributes: ['id', 'name'] },
                {
                    model: CategoryAttribute, as: 'categoryAttributes', attributes: [], include: [
                    {model:VariantAttribute,attributes:['id','name']}
                ]}
            ],
        });
        if (!category) throw new ApiError('Category not found', 404);
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

/* Create a new category */
const addCategory = async (req, res, next) => {
    try {
        const { name, parentId, attributeIds } = req.body;
        if (!name ) throw new ApiError('Name is required', 400);

        const existing = await Category.findOne({ where: { name } });
        if (existing) throw new ApiError('Category exists', 409);

        await db.sequelize.transaction(async t => {
            await fetchParent(parentId); // validate parent if exists
            // const attributes = await fetchAttributes(attributeIds);

            const category = await Category.create({ name, parentId }, { transaction: t });
            if (attributeIds) {
                const categoryAttributes = attributeIds.map(attrId => ({ categoryId: category.id, attributeId: attrId }));
                await CategoryAttribute.bulkCreate(categoryAttributes, { transaction: t });
            }
            
        });

        const newCategory = await Category.findOne({
            where: { name },
            include: [{ model: VariantAttribute, attributes: ['id', 'name'], through: { attributes: [] } }],
        });
        res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
        next(error);
    }
};

/* Get all variants of a category */
const getCategoryVariants = async (req, res, next) => {
    try {
        const variants = await ProductVariant.findAll({
            attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt'],
            include: [
                {
                    model: Product,
                    attributes: ['id', 'name'],
                    required: true,
                    include: [
                        {
                            model: Category,
                            attributes: [],
                            required: true,
                            where: { [Op.or]: [{ id: req.params.id }, { parentId: req.params.id }] },
                        },
                    ],
                },
                {
                    model: VariantAttribute,
                    attributes: ['id', 'name'],
                    through: { model: db.productVariantOption, attributes: ['value'] },
                },
            ],
            order: [['variantName', 'ASC']],
        });

        if (!variants.length) {
            await fetchCategory(req.params.id); // throws if not found
        }

        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

/* Get category hierarchy */
const getCategoryHierarchy = async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { parentId: null },
            attributes: ['id', 'name'],
            include: [{ model: Category, as: 'subcategories', attributes: ['id', 'name'], order: [['name', 'ASC']] }],
            order: [['name', 'ASC']],
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

/* Add products to category */
const addProductsToCategory = async (req, res, next) => {
    try {
        const { categoryId, productIds } = req.body;
        if (!categoryId || !Array.isArray(productIds) || !productIds.length) {
            throw new ApiError('categoryId and productIds are required', 400);
        }

        const category = await fetchCategory(categoryId);
        const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
        if (products.length !== productIds.length) throw new ApiError('Some products not found', 404);

        await category.addProducts(products);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

/* Update category and its attributes */
const updateCategory = async (req, res, next) => {
    try {
        const { name, parentId, attributeIds } = req.body;
        const category = await fetchCategory(req.params.id);

        const existing = name ? await Category.findOne({ where: { name } }) : null;
        if (existing && existing.id !== category.id) throw new ApiError('Category exists', 409);

        await fetchParent(parentId, category.id);

        await db.sequelize.transaction(async t => {
            await category.update({ ...(name && { name }), ...(parentId && { parentId }) }, { transaction: t });
            if (Array.isArray(attributeIds)) {
                const attributes = await fetchAttributes(attributeIds);
                await category.setVariantAttributes(attributes, { transaction: t });
            }
        });

        const updatedCategory = await Category.findByPk(req.params.id, {
            include: [{ model: VariantAttribute, attributes: ['id', 'name'], through: { attributes: [] } }],
        });

        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        next(error);
    }
};

/* Delete category if no subcategories or products */
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'subcategories' },
                { model: Product, through: { attributes: [] } },
            ],
        });

        if (!category) throw new ApiError('Category not found', 404);
        if (category.subcategories.length) throw new ApiError('Cannot delete category with subcategories', 400);
        if (category.Products.length) throw new ApiError('Cannot delete category with assigned products', 400);

        await category.destroy();
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/* Add new attributes to existing category */
const addNewAttributes = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { attributeIds } = req.body;

        if (!Array.isArray(attributeIds) || !attributeIds.length)
            throw new ApiError('attributeIds must be a non-empty array', 400);

        const category = await fetchCategory(id);
        const attributes = await fetchAttributes(attributeIds);

        await category.addVariantAttributes(attributes);

        const updatedCategory = await Category.findByPk(id, {
            include: [{ model: VariantAttribute, attributes: ['id', 'name'], through: { attributes: [] } }],
        });

        res.status(200).json({ success: true, data: updatedCategory });
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
    addNewAttributes,
};
