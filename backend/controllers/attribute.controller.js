const ApiError = require('../utils/ApiError');
const db = require('../models');
const { category: Category,
    categoryAttribute: CategoryAttribute,
    variantAttribute: VariantAttribute } = db;

const addAttribute = async (req, res, next) => {
    try {
        const { name } = req.body;
        const exists = await VariantAttribute.findOne({ where: { name } });
        if (exists) throw new ApiError('Attribute exists', 409);
        const attribute = await VariantAttribute.create({ name });
        res.status(201).json({ success: true, data: attribute });
    } catch (error) {
        next(error);
    }
};

const getAttributes = async (req, res, next) => {
    try {
        const attributes = await VariantAttribute.findAll({
            attributes: ['id', 'name']
        });
        res.status(200).json({ success: true, data: attributes });
    } catch (error) {
        next(error);
    }
};

const getAttribute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const attribute = await VariantAttribute.findByPk(id, {
            attributes: ['id', 'name'] 
        });
        if (!attribute) throw new ApiError('Attribute not found', 404);
        res.status(200).json({ success: true, data: attribute });
    } catch (error) {
        next(error);
    }
};

const deleteAttribute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const attribute = await VariantAttribute.findByPk(id);
        if (!attribute) throw new ApiError('Attribute not found', 404);

        await attribute.destroy();
        res.status(200).json({
            success: true,
            data: attribute
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addAttribute,
    getAttribute,
    getAttributes,
    deleteAttribute
};