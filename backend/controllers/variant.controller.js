const { pool,query } = require('../config/db'); 
const variantQueries = require('../queries/variantQueries');
const ApiError = require('../utils/ApiError');
const generateSKU = require('../utils/generateSKU');
const productQueries = require('../queries/productQueries');
const { handlePreOrdered } = require('../services/variant.service');

// Get all variants
const getVariants = async (req, res, next) => {
  try {
    const rows = await query(variantQueries.getAll);

    const variantsMap = new Map();

    for (const row of rows) {
      if (!variantsMap.has(row.id)) {
        variantsMap.set(row.id, {
          id: row.id,
          SKU: row.SKU,
          variantName: row.variantName,
          price: row.price,
          stockQnt: row.stockQnt,
          productId: row.productId,
          imageURL: row.imageURL,
          productName: row.productName,
          brand: row.brand,
          description: row.description,
          attributes: []
        });
      }

      if (row.attributeId) {
        variantsMap.get(row.id).attributes.push({
          id: row.attributeId,
          name: row.attributeName,
          value: row.attributeValue
        });
      }
    }

    const variants = Array.from(variantsMap.values());

    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get single variant
const getVariant = async (req, res, next) => {
  try {
    const rows = await query(variantQueries.getById, [req.params.id]);

    if (!rows || rows.length === 0) {
      throw new ApiError('Variant not found', 404);
    }

    const variant = {
      id: rows[0].id,
      SKU: rows[0].SKU,
      variantName: rows[0].variantName,
      price: rows[0].price,
      stockQnt: rows[0].stockQnt,
      productId: rows[0].productId,
      imageURL: rows[0].imageURL,
      productName: rows[0].productName,
      brand: rows[0].brand,
      description: rows[0].description,
      attributes: []
    };

    for (const row of rows) {
      if (row.attributeId) {
        variant.attributes.push({
          id: row.attributeId,
          name: row.attributeName,
          value: row.attributeValue
        });
      }
    }

    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
};

// Add variant
const addVariant = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { productId, variantName, price, stockQnt, attributes } = req.body;

    if (!productId || !variantName || !price)
      throw new ApiError('Missing required fields', 400);

    await connection.beginTransaction();

    // Generate SKU
    const SKU = generateSKU('Product', variantName);

    // Insert variant
    const [result] = await connection.query(variantQueries.insert, [
      productId,
      variantName,
      SKU,
      price,
      stockQnt || 1,
      null, // imageURL, optional
    ]);

    const variantId = result.insertId;

    // Insert attributes if provided
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (!attr.id || !attr.value) continue;

        const [attribute] = await connection.query(productQueries.getAttributeById, [attr.id]);
        if (!attribute.length) {
          throw new ApiError(`Attribute with id ${ attr.id } not found`, 404);
        }

        const attributeId = attribute[0].id;

        await connection.query(productQueries.insertVariantOption, [
          variantId,
          attributeId,
          attr.value,
        ]);
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: variantId,
        variantName,
        SKU,
        price,
        stockQnt: stockQnt || 1,
        attributes: attributes || [],
      },
    });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// Update variant
const updateVariant = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { variantName, price, stockQnt, imageURL } = req.body;

    await connection.beginTransaction();

    const [variantRows] = await connection.query(variantQueries.getVariantById, [req.params.id]);
    if (!variantRows.length) throw new ApiError('Variant not found', 404);

    await connection.query(variantQueries.update, [
      variantName || variantRows[0].variantName,
      price !== undefined ? price : variantRows[0].price,
      stockQnt !== undefined ? stockQnt : variantRows[0].stockQnt,
      imageURL || variantRows[0].imageURL,
      req.params.id
    ]);
    await connection.commit();

    res.status(200).json({ success: true, message: 'Variant updated successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// Update variant stock
const updateVariantStock = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { qnt } = req.body;
    await connection.beginTransaction();

    // Update stock (can be positive or negative)
    const [result] = await connection.query(
      variantQueries.updateStockAtomic,
      [qnt, req.params.id, qnt]
    );

    if (result.affectedRows === 0) {
      throw new ApiError('Not enough stock to update', 400);
    }

    // Handle pre-ordered items
    await handlePreOrdered(req.params.id, connection);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const addVariantAttributes = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { attributes } = req.body;

    await connection.beginTransaction();

    const [variant] = await connection.query(
      `SELECT * FROM product_variants WHERE id = ?`,
      [id]
    );

    if (!variant.length) {
      throw new ApiError('variant not found', 404);
    }

    for (const attr of attributes) {
      const [attribute] = await connection.query(
        productQueries.getAttributeById,
        [attr.id]
      );

      if (!attribute.length) {
        throw new ApiError(`Attribute with id ${ attr.id } not found`, 404);
      }

      const attributeId = attribute[0].id;
      await connection.query(productQueries.insertVariantOption, [
        id,
        attributeId,
        attr.value,
      ]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Attributes added successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// Delete variant
const deleteVariant = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [variantRows] = await connection.query(variantQueries.getVariantById, [req.params.id]);
    if (!variantRows.length) throw new ApiError('Variant not found', 404);

    await connection.query(`DELETE FROM product_variant_options WHERE variantId = ?`, [req.params.id]);

    await connection.query(variantQueries.delete, [req.params.id]);

    await connection.commit();

    res.status(200).json({ success: true, message: 'Variant deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};


// Get stock
const getStock = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(variantQueries.getStock, [req.params.id]);
    if (!rows || rows.length === 0) throw new ApiError('Variant not found', 404);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};


// Search & filter variants
const searchAndFilterVariants = async (req, res, next) => {
  try {
    let { keyword, minPrice, maxPrice } = req.query;
    keyword = keyword || null;
    minPrice = minPrice !== undefined ? minPrice : null;
    maxPrice = maxPrice !== undefined ? maxPrice : null;
    const variants= await query(variantQueries.searchAndFilter, [
      keyword, keyword, keyword, keyword,
      minPrice, minPrice,
      maxPrice, maxPrice
    ]);
    if (!variants) throw new ApiError('No matching variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get low stock variants
const getLowStockVariants = async (req, res, next) => {
  try {
    const qnt = req.query.qnt || 5;
    const variants = await pool.query(variantQueries.getLowStock, [qnt]);
    if (!variants) throw new ApiError('No low stock variants found', 404);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

// Get popular variants
const getPopularVariants = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit )|| 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const [variants] = await pool.query(variantQueries.getPopular, [startDate]);
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVariants,
  getVariant,
  addVariant,
  updateVariant,
  updateVariantStock,
  deleteVariant,
  getStock,
  searchAndFilterVariants,
  getLowStockVariants,
  getPopularVariants,
  addVariantAttributes
}