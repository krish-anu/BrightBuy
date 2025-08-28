const ApiError = require('../utils/ApiError');
const { fn, col } = require('sequelize');

const db = require('../models');
const generateSKU = require('../utils/generateSKU');
const Product = db.product;
const ProductVariant = db.productVariant;
const Category = db.category;
const VariantAttribute = db.variantAttribute;
const ProductVariantOption = db.productVariantOption;

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
        const { name, description, categoryIds, brand, attributes,stockQnt,price } = req.body;
        if (!name || !description || !attributes || !price) throw new ApiError('Name, description,price and attributes are required', 400);

        const existing = await Product.findOne({ where: { name } });
        if (existing) throw new ApiError('Product exists', 409);

        const newProduct = await db.sequelize.transaction(async (t) => {
            const productData = { name, description };
            if (brand) productData.brand = brand;
            const product = await Product.create(productData,{transaction:t});

            if (Array.isArray(categoryIds) && categoryIds.length) {
                const categories = await Category.findAll({ where: { id: categoryIds } });
                await product.setCategories(categories,{transaction:t});
            } 
            
            const attrName = attributes.map((attr) => attr.value).join(' ');
            const variantName = `${ product.name } ${ attrName }`;
            const SKU = generateSKU(product.name, variantName);
            

            const variant = await ProductVariant.create(
                { productId:product.id, variantName: variantName, SKU, stockQnt: stockQnt || 1, price },
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
            return product;
        });
        res.status(201).json({ success: true, data: newProduct });
    }
    catch (error) { next(error); }
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
        const product = await Product.findByPk(req.params.id);
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