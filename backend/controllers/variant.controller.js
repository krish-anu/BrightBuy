const ApiError = require('../utils/ApiError');
const { Op, fn, col } = require('sequelize');

const db = require('../models');
const Product = db.product;
const ProductVariant = db.productVariant;
const Category = db.category;
const VariantAttribute = db.variantAttribute;
const ProductVariantOption = db.productVariantOption;


const generateSKU = (productName, attributes = []) => {
    // need to implement
    const base = (productName || 'PRD').replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const attrPart = attributes.map(a => (a.value ? a.value.substring(0, 2).toUpperCase() : '')).join('');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${ base }-${ attrPart }-${ random }`;
};

const getVariants = async (req, res, next) => {
    try {
        const variants = await ProductVariant.findAll({
            attributes: ['id', 'SKU', 'variantName', 'price', 'stockQnt', 'productId'],
            include: [{
                model: Product, attributes: ['id', 'name'],
                include: [{ model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] } }]
            }],
            order: [['createdAt', 'DESC']],
            distinct:true,
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
            include: [{
                model: Product, attributes: ['id', 'name'],
                include: [{ model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] } }]
            }]
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
        if (!productId || !price || !attributes) throw new ApiError('Product id, price, attributes are required', 400);

        await db.sequelize.transaction(async t => {
            const product = await Product.findByPk(productId, { transaction: t });
            if (!product) throw new ApiError('Product not found', 404);

            const attrName = attributes.map(attr => attr.value).join(' ');
            const name = variantName ? variantName : `${ product.name } ${ attrName }`;
            const SKU = generateSKU(product.name, attributes);
            const qnt = stockQnt ? stockQnt : 1;
            const variant = await ProductVariant.create(
                { ProductId: productId, variantName: name, SKU: SKU, stockQnt: qnt, price: price },
                { transaction: t }
            );

            for (const attr of attributes) {
                const [attribute] = await VariantAttribute.findOrCreate({
                    where: { name: attr.name },
                    defaults: { name: attr.name },
                    transaction: t,
                });

                await ProductVariantOption.create({
                    variantId: variant.id,
                    attributeId: attribute.id,
                    value: attr.value
                }, { transaction: t });
            }

            res.status(201).json({ success: true, data: variant });
        });
    } catch (error) {
        next(error);
    }
};

/*search by name and filter by attributes,price range*/
const searchAndFilterVariants = async (req, res, next) => {
    try {
        const filters = {};
        for (const q in req.query) {
            if (q !== 'keyword' && q !== 'minPrice' && q !== 'maxPrice')
                filters[q] = req.query[q].split(',');
        }
        const attrInclude = [];
        for (const [attr, val] of Object.entries(filters)) {
            attrInclude.push({
                model: VariantAttribute,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                where: { name: attr },
                through: { where: { value: { [Op.in]: val } }, attributes: [] },
                required: true,
            });
        }
        const whereClause = {};
        if (req.query.keyword)
            whereClause.variantName = { [Op.like]: `%${ req.query.keyword }%` };
        if (req.query.minPrice || req.query.maxPrice) {
            whereClause.price = {};
            if (req.query.minPrice)
                whereClause.price[Op.gte] = +req.query.minPrice;
            if (req.query.maxPrice)
                whereClause.price[Op.lte] = +req.query.maxPrice;
        }

        const variants = await ProductVariant.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            where: whereClause,
            include: attrInclude,
            order: [['price', 'ASC']],
            distinct: true,
        });
        if (!variants.length) throw new Error('Matching variants not found', 404);
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

const getLowStockVariants = async (req, res, next) => {
    try {
        const qnt = req.query.qnt ? +req.query.qnt : 5;
        const variants = await ProductVariant.findAll({
            where: { stockQnt: { [Op.lte]: qnt } },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
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
       res.status(200).json({success:true}) 
    } catch (error) {
        next(error)
    }
}

const updateVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id);
        if (!variant) throw new ApiError('Variant not found', 404);
        const { variantName, price, stockQnt } = req.body;
        await variant.update({ variantName, price, stockQnt });
        res.status(200).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

const updateStock = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findByPk(req.params.id);
        if (!variant) throw new ApiError('Variant not found', 404);
        const { stockQnt } = req.body;
        if (stockQnt < 0) throw new ApiError('Quantity shouldnot be negative', 400);
        await variant.update({ stockQnt });

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