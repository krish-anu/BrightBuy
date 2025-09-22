// stockService.js
const ApiError = require('../utils/ApiError');
const {query} = require('../config/db');
const variantQueries = require('../queries/variantQueries');

const handlePreOrdered = async (variantId, connection) => {
  const [items] = await connection.query(variantQueries.getPreOrderedItems, [variantId]);
  if (!items.length) return { processedItems: 0, remainingStock: null, updatedItems: [] };

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const [result] = await connection.query(
    variantQueries.updateStockAtomic,
    [-totalQty, variantId, -totalQty]
  );

  let processedItems = [];
  if (result.affectedRows === 0) {
    const [stockRows] = await connection.query(`SELECT stockQnt FROM product_variants WHERE id = ?`, [variantId]);
    let currStock = stockRows[0].stockQnt;

    for (const item of items) {
      if (currStock < item.quantity) break;
      currStock -= item.quantity;
      processedItems.push(item);
    }

    if (processedItems.length > 0) {
      const itemIds = processedItems.map(i => i.id);
      const { sql, values } = variantQueries.markItemsAsProcessed(itemIds);
      await connection.query(sql, values);

      const qtyToDeduct = processedItems.reduce((sum, i) => sum + i.quantity, 0);
      await connection.query(variantQueries.updateStockAtomic, [-qtyToDeduct, variantId, -qtyToDeduct]);
    }

    return { processedItems: processedItems.length, remainingStock: currStock, updatedItems: processedItems };
  }

  const itemIds = items.map(i => i.id);
  const { sql, values } = variantQueries.markItemsAsProcessed(itemIds);
  await connection.query(sql, values);

  const [currStockRow] = await connection.query(`SELECT stockQnt FROM product_variants WHERE id = ?`, [variantId]);
  return { processedItems: items.length, remainingStock: currStockRow[0].stockQnt, updatedItems: items };
};

// const updateStock = async (variantId, quantityChange, connection) => {
//   const [result] = await connection.query(
//     `UPDATE product_variants 
//      SET stockQnt = stockQnt + ? 
//      WHERE id = ? AND stockQnt + ? >= 0`,
//     [quantityChange, variantId, quantityChange]
//   );

//   if (result.affectedRows === 0) {
//     throw new ApiError('Variant not found or insufficient stock', 400);
//   }

//   const [variantRows] = await connection.query(
//     `SELECT id, stockQnt FROM product_variants WHERE id = ?`,
//     [variantId]
//   );
//   return { id: variantId, stockQnt: variantRows[0].stockQnt };
// };

const updateStock = async (variantId, quantityChange, connection) => {

  const [variantRows] = await connection.query(
    `SELECT * FROM product_variants WHERE id = ? FOR UPDATE`,
    [variantId]
  );

  if (!variantRows.length) {
    throw new ApiError('Variant not found', 404);
  }

  const newStock = variantRows[0].stockQnt + quantityChange;

  if (newStock < 0) {
    throw new ApiError('Stock cannot go below 0', 400);
  }

  await connection.query(
    `UPDATE product_variants SET stockQnt = ? WHERE id = ?`,
    [newStock, variantId]
  );

  return { id: variantId, stockQnt: newStock };
};

const restock = async (orderId, connection) => {
  const [orderRows] = await connection.query(
    `SELECT * FROM orders WHERE id = ?`,
    [orderId]
  );

  if (!orderRows.length) throw new ApiError('Order not found', 404);

  const order = orderRows[0];

  if (order.status !== 'Cancelled') return;

  // Get all items that were actually deducted from stock
  const [items] = await connection.query(
    `SELECT variantId, quantity FROM order_items WHERE orderId = ? AND isBackOrdered = 0`,
    [orderId]
  );

  // Restock each item safely
  for (const item of items) {
    await updateStock(item.variantId, item.quantity, connection);
  }
};

// const restock = async (orderId, connection) => {
//   const [orderRows] = await connection.query(
//     `SELECT id, status FROM orders WHERE id = ?`,
//     [orderId]
//   );
//   if (!orderRows.length) throw new ApiError('Order not found', 404);
//   const order = orderRows[0];

//   if (order.status !== 'Cancelled') return;

//   const [items] = await connection.query(
//     `SELECT variantId, quantity 
//      FROM order_items 
//      WHERE orderId = ? AND isBackOrdered = 0`,
//     [orderId]
//   );

//   for (const item of items) {
//     await updateStock(item.variantId, item.quantity, connection);
//   }
// };

module.exports = { updateStock, restock };


module.exports = {
  handlePreOrdered,
  updateStock,
  restock,
};
