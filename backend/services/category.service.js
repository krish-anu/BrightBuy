const ApiError = require('../utils/ApiError');
const db = require('../models');

const { category: Category,
    variantAttribute: VariantAttribute } = db;



const fetchCategory = async (id) => {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError('Category not found', 404);
    return category;
};

const fetchAttributes = async (attributeIds) => {
    const attributes = await VariantAttribute.findAll({ where: { id: attributeIds } });
    if (attributes.length !== attributeIds.length) throw new ApiError('Some attributes not found', 404);
    return attributes;
};

const fetchParent = async (parentId, selfId) => {
    if (!parentId) return null;
    if (parentId === selfId) throw new ApiError('Cannot be own parent', 400);
    const parent = await Category.findByPk(parentId);
    if (!parent) throw new ApiError('Parent category not found', 404);
    return parent;
};



module.exports = {
    fetchCategory,
    fetchAttributes,
    fetchParent
}