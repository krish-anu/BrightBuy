const ApiError = require('../utils/ApiError');
const {query} = require('../config/db'); // MySQL wrapper
const attributeQueries = require('../queries/attributeQueries');

const addAttribute = async (req, res, next) => {
  try {
    const { name } = req.body;

    const exists = await query(attributeQueries.checkAttributeExists, [name]);
    if (exists.length) throw new ApiError('Attribute exists', 409);

    const result = await query(attributeQueries.insertAttribute, [name]);
    const insertedId = result.insertId;

    const [attributeRows] = await query(attributeQueries.getAttributeById, [insertedId]);
    res.status(201).json({ success: true, data: attributeRows });
  } catch (error) {
    next(error);
  }
};

const getAttributes = async (req, res, next) => {
  try {
    const attributes = await query(attributeQueries.getAllAttributes);
    res.status(200).json({ success: true, data: attributes });
  } catch (error) {
    next(error);
  }
};

const getAttribute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [attribute] = await query(attributeQueries.getAttributeById, [id]);
    if (!attribute) throw new ApiError('Attribute not found', 404);
    res.status(200).json({ success: true, data: attribute });
  } catch (error) {
    next(error);
  }
};

const deleteAttribute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [attribute] = await query(attributeQueries.getAttributeById, [id]);
    if (!attribute) throw new ApiError('Attribute not found', 404);

    await query(attributeQueries.deleteAttributeById, [id]);
    res.status(200).json({ success: true, data: attribute });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addAttribute,
  getAttributes,
  getAttribute,
  deleteAttribute,
};
