const ApiError = require('../utils/ApiError');
const { fn, col, Op } = require('sequelize');

const db = require('../models');
const generateSKU = require('../utils/generateSKU');

const { orderItem: OrderItem,
    product: Product,
    productVariant: ProductVariant,
    category: Category,
    productVariantOption: ProductVariantOption,
    variantAttribute:VariantAttribute
} = db;

/* Get all products with variants*/
const getProducts = async (req, res, next) => {
    try {
        const { limit } = req.query;

        const products = await Product.findAll({
            attributes: ['id', 'name', 'description', 'brand'],
            include: [
                { model: Category, attributes: ['id', 'name'], through: { attributes: [] } },
                { model: ProductVariant, attributes: ['id', 'variantName', 'price', 'stockQnt'] },
            ],
            limit: limit ? parseInt(limit) : undefined,
            order: [['name', 'ASC']],
            distinct: true,
        });

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

/* Get product by id with varinats and attribute values*/
const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            attributes: ['id', 'name', 'description'],
            include: [{ model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] } },
            { model: ProductVariant, include: [{ model: VariantAttribute, attributes: ['id', 'name'], through: { model: ProductVariantOption, attributes: ['value'] } }] }]
        });
        if (!product) throw new ApiError('Product not found', 404);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const addProduct = async (req, res, next) => {
    try {
        const { name, description, categoryIds, brand, attributes, stockQnt, price } = req.body;
        if (!name || !description || !price || !categoryIds || !Array.isArray(attributes) || attributes.length === 0) {
            throw new ApiError('Name, description, price, categoryIds and attributes are required', 400);
        }
        const existingProduct = await Product.findOne({ where: { name } });
        if (existingProduct) throw new ApiError('Product already exists', 409);
        const newProduct = await db.sequelize.transaction(async (t) => {
            const productData = { name, description };
            if (brand) productData.brand = brand;
            for (const attr of attributes) {
                if (!attr.id || !attr.value) {
                    throw new ApiError('Each attribute must have an id and value', 400);
                }
            }
            const product = await Product.create(productData, { transaction: t });
            if (Array.isArray(categoryIds) && categoryIds.length) {
                const categories = await Category.findAll({ where: { id: categoryIds } });
                if (categories.length !== categoryIds.length) {
                    throw new ApiError('Some categories not found', 404);
                }
                await product.setCategories(categories, { transaction: t });
            }
            const attributeIds = attributes.map(a => a.id);
            const existingAttributes = await VariantAttribute.findAll({
                where: { id: attributeIds },
                transaction: t
            });
            if (existingAttributes.length !== attributeIds.length) {
                throw new ApiError('Some attributes do not exist', 404);
            }
            const variantName = `${ product.name } ${ attributes.map(a => a.value).join(' ') }`;
            const SKU = generateSKU(product.name, variantName);

            const variant = await ProductVariant.create({
                productId: product.id,
                variantName,
                SKU,
                stockQnt: stockQnt || 1,
                price
            }, { transaction: t });

            for (const attr of attributes) {
                const attribute = existingAttributes.find(a => a.id === attr.id);
                await ProductVariantOption.create({
                    variantId: variant.id,
                    attributeId: attribute.id,
                    value: attr.value
                }, { transaction: t });
            }

            return product;
        });

        res.status(201).json({ success: true, data: newProduct });

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
            order: [['name', 'ASC']],
        });
        res.status(200).json({ success: true, data: productCount });
    } catch (error) {
        next(error);
    }
};

/*Get all variants of a product by id */
const getVariantsOfProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await db.product.findByPk(productId);
        if (!product) throw new ApiError('Product not found', 404);
        const variants = await db.productVariant.findAll({
            where: { productId },
            include: [{
                model: VariantAttribute,
                attributes: ['id', 'name'],
                through: {
                    model: ProductVariantOption,
                    attributes: ['value']
                }
            }],
            order: [['variantName', 'ASC']]
        });
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

/*Total products*/
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
        const { name, description, brand } = req.body;
        const product = await Product.findByPk(req.params.id);
        if (!product) throw new ApiError('Product not found', 404);

        if (name) {
            const existing = await Product.findOne({ where: { name } });
            if (existing && existing.id !== product.id) throw new ApiError('Product name already exists', 409);
        }

        await product.update({
            name: name || product.name,
            description: description || product.description,
            brand: brand || product.brand
        });

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: ProductVariant }]
        });
        if (!product) throw new ApiError('Product not found', 404);
        if (product.ProductVariants && product.ProductVariants.length > 0) {
            throw new ApiError('Cannot delete product with existing variants', 400);
        }
        await product.destroy();
        res.status(200).json({ success: true, message: 'Product deleted successfully' });

    } catch (error) {
        next(error);
    }
};

/*Get weekly/ monthly/ alltime most sold products*/
const getPopularProduct = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const period = req.query.period || 'all'; // 'weekly', 'monthly', 'all'

        let orderItemFilter = {};

        if (period === 'weekly') {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 7);
            orderItemFilter = { createdAt: { [Op.gte]: fromDate } };
        } else if (period === 'monthly') {
            const fromDate = new Date();
            fromDate.setMonth(fromDate.getMonth() - 1);
            orderItemFilter = { createdAt: { [Op.gte]: fromDate } };
        }
        const products = await Product.findAll({
            attributes: [
                'id', 'name', 'brand', 'description',
                [fn('SUM', col('ProductVariants.OrderItems.quantity')), 'soldQuantity']
            ],
            include: [{
                model: ProductVariant,
                attributes: [],
                required: true,
                include: [{
                    model: OrderItem,
                    attributes: [],
                    required: true,
                    where: orderItemFilter
                }]
            }],
            group: ['Product.id'],
            order: [[fn('SUM', col('ProductVariants.OrderItems.quantity')), 'DESC']],
            limit,
            subQuery: false
        });

        res.status(200).json({ success: true, data: products });
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
    getProductCount,
    getPopularProduct
};