const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const db = require('../models');
const generateSKU  = require('../utils/generateSKU');

const Product = db.product;
const ProductVariant = db.productVariant;
const VariantAttribute = db.variantAttribute;
const ProductVariantOption = db.productVariantOption;

const getVariants = async (req, res, next) => {
    try {
        const variants = await ProductVariant.findAll({
            attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt', 'productId'],
            include: [
                { model: Product, attributes: ['id', 'name'] },
                {
                    model: VariantAttribute,
                    attributes: ['id', 'name'],
                    through: { model: ProductVariantOption, attributes: ['value'] },
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id, {
            attributes: ['id', 'variantName', 'SKU', 'stockQnt', 'price', 'productId'],
            include: [
                { model: Product, attributes: ['id', 'name'] },
                {
                    model: VariantAttribute,
                    attributes: ['id', 'name'],
                    through: { model: ProductVariantOption, attributes: ['value'] },
                },
            ],
        });
        if (!variant) throw new ApiError('Variant not found', 404);
        res.status(200).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

const addVariant = async (req, res, next) => {
    try {
        const { variantName, productId, price, stockQnt, attributes } = req.body;
        if (!productId || !price || !attributes) {
            throw new ApiError('Product id, price, attributes are required', 400);
        }

        const newVariant = await db.sequelize.transaction(async (t) => {
            const product = await Product.findByPk(productId, { transaction: t });
            if (!product) throw new ApiError('Product not found', 404);

            const attrName = attributes.map((attr) => attr.value).join(' ');
            const name = variantName || `${ product.name } ${ attrName }`;
            const SKU = generateSKU(product.name, name);

            const variant = await ProductVariant.create(
                { productId, variantName: name, SKU, stockQnt: stockQnt || 1, price },
                { transaction: t }
            );

            for (const attr of attributes) {
                const [attribute] = await VariantAttribute.findOrCreate({
                    where: { name: attr.name },
                    defaults: { name: attr.name },
                    transaction: t,
                });
                await ProductVariantOption.create(
                    { variantId: variant.id, attributeId: attribute.id, value: attr.value },
                    { transaction: t }
                );
            }
            return variant;
        });

        res.status(201).json({ success: true, data: newVariant });
    } catch (error) {
        next(error);
    }
};

const searchAndFilterVariants = async (req, res, next) => {
    try {
        const filters = {};
        for (const q in req.query) {
            if (q !== 'keyword' && q !== 'minPrice' && q !== 'maxPrice') {
                filters[q] = req.query[q].split(',');
            }
        }

        const attrInclude = Object.entries(filters).map(([attr, val]) => ({
            model: VariantAttribute,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: { name: attr },
            through: { where: { value: { [Op.in]: val } }, attributes: [] },
            required: true,
        }));

        const whereClause = {};
        if (req.query.keyword) {
            whereClause[Op.or] = [
                { variantName: { [Op.like]: `%${ req.query.keyword }%` } },
                { '$Product.description$': { [Op.like]: `%${ req.query.keyword }%` } },
                { '$Product.brand$': { [Op.like]: `%${ req.query.keyword }%` } },
            ];
        }
        if (req.query.minPrice || req.query.maxPrice) {
            whereClause.price = {};
            if (req.query.minPrice) whereClause.price[Op.gte] = +req.query.minPrice;
            if (req.query.maxPrice) whereClause.price[Op.lte] = +req.query.maxPrice;
        }

        const variants = await ProductVariant.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: whereClause,
            include: [
                { model: Product, attributes: ['id', 'name', 'brand', 'description'] },
                ...attrInclude,
            ],
            order: [['price', 'ASC']],
            distinct: true,
        });

        if (!variants.length) throw new ApiError('Matching variants not found', 404);
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getLowStockVariants = async (req, res, next) => {
    try {
        const qnt = req.query.qnt ? req.query.qnt : 5;
        const variants = await ProductVariant.findAll({
            where: { stockQnt: { [Op.lte]: qnt } },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include:[{
                model: db.variantAttribute,
                attributes: ['id', 'name'],
                through: {
                    model: db.productVariantOption,
                    attributes: ['value']
                }
            }],
            order: [['stockQnt', 'ASC']],
        });
        if (!variants.length)
            throw new ApiError(`Variants with stock quantity ≤ ${ qnt } not found`, 404);

        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getPopularVariants = async (req, res, next) => {
    try {
        // orderItems needed
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

const updateVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id);
        if (!variant) throw new ApiError('Variant not found', 404);
        const { variantName, price, stockQnt } = req.body;
        await variant.update({
            variantName: variantName || variant.variantName,
            price: price !== undefined ? price : variant.price,
            stockQnt: stockQnt !== undefined ? stockQnt : variant.stockQnt
        });
        res.status(200).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

// const replaceStock = async (req, res, next) => {
//     try {
//         const variant = await ProductVariant.findByPk(req.params.id);
//         if (!variant) throw new ApiError('Variant not found', 404);
//         const { stockQnt } = req.body;
//         if (stockQnt < 0) throw new ApiError('Quantity shouldnot be negative', 400);
//         await variant.update({ stockQnt });
//         res.status(200).json({ success: true, data: variant });
//     } catch (error) {
//         next(error);
//     }
// };

const updateStock = async (req, res, next) => {
    // use transaction and lock
    try {
        const { qnt } = req.body;
        const variant = await ProductVariant.findByPk(req.params.id, {
            attributes: { include: ['id', 'variantName', 'SKU', 'stockQnt', 'updatedAt'] }
        });
        if (!variant) throw new ApiError('Variant not found', 404);
        const newStock = variant.stockQnt + qnt;
        if (newStock < 0) throw new ApiError('Stock cannot go below 0', 400);
        await variant.increment('stockQnt', { by: qnt });
        await variant.reload();
        res.status(200).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

const getStock = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id, {
            attributes: ['id', 'variantName', 'SKU', 'stockQnt']
        });
        if (!variant) throw new ApiError('Variant not found', 404);

        res.status(200).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

const deleteVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id);
        if (!variant) throw new ApiError('Variant not found', 404);
        await variant.destroy();
        res.status(200).json({ success: true, message: 'Variant deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVariants,
    getVariant,
    addVariant,
    getLowStockVariants,
    getPopularVariants,
    updateVariant,
    updateStock,
    deleteVariant,
    searchAndFilterVariants
};