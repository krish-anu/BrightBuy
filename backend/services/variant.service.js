// stockService.js
const ApiError = require('../utils/ApiError');
const {query} = require('../config/db');
const stockQueries = require('../queries/variantQueries');

const handlePreOrdered = async (variantId, connection) => {
  try {
    const [variantRows] = await query(stockQueries.getVariantById, [variantId], connection);
    if (!variantRows) throw new ApiError('Variant not found', 404);
    let currStock = variantRows.stockQnt;

    const items = await query(stockQueries.getPreOrderedItems, [variantId], connection);
    if (!items.length) throw new ApiError('No preordered items found', 404);

    const updatedItems = [];
    for (const item of items) {
      if (currStock < item.quantity) break;
      currStock -= item.quantity;
      updatedItems.push(item);
    }

    if (updatedItems.length > 0) {
      const itemIds = updatedItems.map((i) => i.id);
      await query(stockQueries.markItemsAsProcessed(itemIds), itemIds, connection);

      const change = variantRows.stockQnt - currStock;
      await query(stockQueries.updateVariantStock, [-change, variantId], connection);
    }

    return { processedItems: updatedItems.length, remainingStock: currStock, updatedItems };
  } catch (error) {
    throw error;
  }
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
