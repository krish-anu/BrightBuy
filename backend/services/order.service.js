const ApiError = require('../utils/ApiError');

const { updateStock, } = require('../services/variant.service')

const saveOrderToDatabase = async (items, userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, paymentMethod, connection, paymentIntentId = null) => {
  const orderId = await createOrder(userId, deliveryMode, JSON.stringify(finalAddress), deliveryDate, totalPrice, deliveryCharge, paymentMethod, connection);
  await addOrderItems(orderId, items, connection);
  return getOrderDetails(orderId, connection);
};

const createOrder = async (userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod,connection) => {
  const status = paymentMethod === 'CashOnDelivery' ? 'Confirmed' : 'Pending';
  const sql = `
    INSERT INTO orders (userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status];
  const [result] = await connection.query(sql, values);
  return result.insertId;
};

const addOrderItems = async (orderId, items, connection) => {
  for (const item of items) {
    const [variantRows] = await connection.query(`SELECT * FROM product_variants WHERE id = ?`, [item.variantId]);

    if (variantRows.length === 0) {
      throw new ApiError('Variant not found', 404);
    }

    const variant = variantRows[0];

    const sql = `
      INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice, isBackOrdered)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await connection.query(sql, [
      orderId,
      item.variantId,
      item.quantity,
      variant.price,
      variant.price * item.quantity,
      item.isBackOrdered
    ]);

    if (!item.isBackOrdered) {
      await updateStock(item.variantId, -item.quantity, connection);
    }
  }
};

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
