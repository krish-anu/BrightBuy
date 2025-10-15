const ApiError = require('../utils/ApiError');

// Use DB stored procedures for atomic order creation and item handling
const saveOrderToDatabase = async (items, userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, paymentMethod, connection, paymentIntentId = null) => {
  // Call sp_create_order to insert optional address (for Standard Delivery), order, and delivery row
  const line1 = finalAddress?.line1 || null;
  const line2 = finalAddress?.line2 || null;
  const city = finalAddress?.city || null;
  const postalCode = finalAddress?.postalCode || null;

  const [spOrderRows] = await connection.query(
    `CALL sp_create_order(?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, deliveryMode, paymentMethod, line1, line2, city, postalCode, deliveryCharge]
  );
  // CALL returns multiple result sets; first set contains our SELECT with orderId
  // Depending on mysql2 version: spOrderRows[0] or spOrderRows[0][0]
  const orderRow = Array.isArray(spOrderRows) && spOrderRows[0] ? (Array.isArray(spOrderRows[0]) ? spOrderRows[0][0] : spOrderRows[0]) : null;
  const orderId = orderRow?.orderId || orderRow?.ORDERID || orderRow?.order_id;
  if (!orderId) throw new ApiError('Failed to create order via stored procedure', 500);

  // Add items using sp_add_order_item which locks stock and sets totals
  for (const item of items) {
    await connection.query(`CALL sp_add_order_item(?, ?, ?, ?)`, [orderId, item.variantId, item.quantity, item.isBackOrdered ? 1 : 0]);
  }

  // Fetch and return full order details
  return getOrderDetails(orderId, connection);
};

// Legacy helpers kept for completeness (unused when using stored procedures)
const createOrder = async () => { throw new ApiError('createOrder is superseded by stored procedures', 500); };
const addOrderItems = async () => { throw new ApiError('addOrderItems is superseded by stored procedures', 500); };

const getOrderDetails = async (orderId, connection) => {
  const [orders] = await connection.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);

  if (!orders.length) {
    throw new ApiError('Order not found', 404);
  }

  const order = orders[0];
  const [items] = await connection.query(`
    SELECT oi.*, pv.variantName, pv.SKU, pv.price AS variantPrice, pv.stockQnt,
           p.id AS productId, p.name AS productName
    FROM order_items oi
    LEFT JOIN product_variants pv ON oi.variantId = pv.id
    LEFT JOIN products p ON pv.productId = p.id
    WHERE oi.orderId = ?
  `, [orderId]);

  order.items = items;
  console.log(order)
  return order;
};

const isValidUpdate = async (newStatus, currStatus) => {
  const validStatus = {
    Pending: 0,
    Confirmed: 1,
    Shipped: 2,
    Delivered: 3,
    Returned: 4,
    Failed: 5,
  };

  if (!(newStatus in validStatus)) {
    throw new ApiError(`Invalid status: ${newStatus}`, 400);
  }

  if (!(currStatus in validStatus)) {
    throw new ApiError(`Invalid current status in DB: ${currStatus}`, 500);
  }

  if (validStatus[newStatus] <= validStatus[currStatus]) {
    throw new ApiError(`Invalid update from ${currStatus} to ${newStatus}`, 400);
  }

  return true;
};


module.exports = {
  saveOrderToDatabase,
  createOrder,
  addOrderItems,
  getOrderDetails,
  isValidUpdate
};
