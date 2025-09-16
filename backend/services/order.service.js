const pool = require('../config/db'); // MySQL pool
const ApiError = require('../utils/ApiError');

const { restock,updateStock, }=require('../services/variant.service')

const saveOrderToDatabase = async (items, userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, paymentMethod, paymentIntentId = null) => {
  const orderId = await createOrder(userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, paymentMethod);
  await addOrderItems(orderId, items);
  await createPayment(orderId, totalPrice, deliveryCharge, paymentMethod, paymentIntentId);
  return getOrderDetails(orderId);
};

const createOrder = async (userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod) => {
  const status = paymentMethod === 'COD' ? 'Confirmed' : 'Pending';
  const sql = `
    INSERT INTO orders (UserId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status];
  const [result] = await pool.promise().query(sql, values);
  return result.insertId;
};

const addOrderItems = async (orderId, items) => {
  for (const item of items) {
    const [variantRows] = await pool.promise().query(`SELECT * FROM product_variants WHERE id = ?`, [item.variantId]);
    const variant = variantRows[0];
    if (!variant) throw new ApiError('Variant not found', 404);

    const isBackOrdered = variant.stockQnt < item.quantity;

    const sql = `
      INSERT INTO order_items (OrderId, ProductVariantId, quantity, unitPrice, totalPrice, isBackOrdered)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.promise().query(sql, [orderId, item.variantId, item.quantity, variant.price, variant.price * item.quantity, isBackOrdered]);

    if (!isBackOrdered) {
      await updateStock(item.variantId, -item.quantity);
    }
  }
};

const getOrderDetails = async (orderId) => {
  const [orders] = await pool.promise().query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!orders.length) throw new ApiError('Order not found', 404);
  const order = orders[0];

  const [items] = await pool.promise().query(`
    SELECT oi.*, pv.variantName, pv.SKU, pv.price, pv.stockQnt
    FROM order_items oi
    JOIN product_variants pv ON oi.ProductVariantId = pv.id
    WHERE oi.OrderId = ?
  `, [orderId]);

  order.items = items;
  return order;
};

const updateStock = async (variantId, quantityChange) => {
  const [rows] = await pool.promise().query(`SELECT * FROM product_variants WHERE id = ?`, [variantId]);
  const variant = rows[0];
  if (!variant) throw new ApiError('Variant not found', 404);

  const newStock = variant.stockQnt + quantityChange;
  if (newStock < 0) throw new ApiError('Stock cannot go below 0', 400);

  await pool.promise().query(`UPDATE product_variants SET stockQnt = ? WHERE id = ?`, [newStock, variantId]);
  return { ...variant, stockQnt: newStock };
};

const restock = async (orderId) => {
  const [orders] = await pool.promise().query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!orders.length) throw new ApiError('Order not found', 404);
  const order = orders[0];

  if (order.status !== 'Cancelled') return;

  const [items] = await pool.promise().query(`SELECT * FROM order_items WHERE OrderId = ?`, [orderId]);
  for (const item of items) {
    if (!item.isBackOrdered) await updateStock(item.ProductVariantId, item.quantity);
  }
};

module.exports = {
  saveOrderToDatabase,
  createOrder,
  addOrderItems,
  getOrderDetails,
  updateStock,
  restock
};
