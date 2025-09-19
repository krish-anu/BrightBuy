// stockService.js
const ApiError = require('../utils/ApiError');
const {query} = require('../config/db');
const variantQueries = require('../queries/variantQueries');

const handlePreOrdered = async (variantId, connection) => {
  // Get all pre-ordered items
  const [items] = await connection.query(variantQueries.getPreOrderedItems, [variantId]);

  if (!items.length) return { processedItems: 0, remainingStock: null, updatedItems: [] };

  // Calculate how many can be fulfilled
  const totalQtyToProcess = items.reduce((sum, item) => sum + item.quantity, 0);

  // Atomic stock update
  const [result] = await connection.query(
    variantQueries.updateStockAtomic,
    [-totalQtyToProcess, variantId, -totalQtyToProcess]
  );

  if (result.affectedRows === 0) {
    // Not enough stock to process all items, process partially
    let currStockResult = await connection.query(`SELECT stockQnt FROM product_variants WHERE id = ?`, [variantId]);
    let currStock = currStockResult[0][0].stockQnt;

    const updatedItems = [];
    for (const item of items) {
      if (currStock < item.quantity) break;
      currStock -= item.quantity;
      updatedItems.push(item);
    }

    if (updatedItems.length > 0) {
      const itemIds = updatedItems.map(i => i.id);
      await connection.query(variantQueries.markItemsAsProcessed(itemIds), itemIds);

      await connection.query(
        variantQueries.updateStockAtomic,
        [-updatedItems.reduce((sum, i) => sum + i.quantity, 0), variantId, -updatedItems.reduce((sum, i) => sum + i.quantity, 0)]
      );
    }

    return { processedItems: updatedItems.length, remainingStock: currStock, updatedItems };
  }

  // All items processed
  const itemIds = items.map(i => i.id);
  await connection.query(variantQueries.markItemsAsProcessed(itemIds), itemIds);

  const [currStockRow] = await connection.query(`SELECT stockQnt FROM product_variants WHERE id = ?`, [variantId]);
  const remainingStock = currStockRow[0].stockQnt;

  return { processedItems: items.length, remainingStock, updatedItems: items };
};


const updateStock = async (variantId, quantityChange, connection) => {
  const [variantRows] = await query(stockQueries.getVariantById, [variantId], connection);
  if (!variantRows) throw new ApiError('Variant not found', 404);

  const newStock = variantRows.stockQnt + quantityChange;
  if (newStock < 0) throw new ApiError('Stock cannot go below 0', 400);

  await query(stockQueries.updateVariantStock, [quantityChange, variantId], connection);
  return { id: variantId, stockQnt: newStock };
};

const restock = async (orderId, connection) => {
  const [orderRows] = await query(stockQueries.getOrderById, [orderId], connection);
  if (!orderRows.length) throw new ApiError('Order not found', 404);
  const order = orderRows[0];

  if (order.status !== 'Cancelled') return;

  const items = await query(stockQueries.getOrderItemsByOrderId, [orderId], connection);

  for (const item of items) {
    if (!item.preOrdered) {
      await updateStock(item.variantId, item.quantity, connection);
    }
  }
};

module.exports = {
  handlePreOrdered,
  updateStock,
  restock,
};
