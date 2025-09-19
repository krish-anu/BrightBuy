// Orders Queries
const getAllOrders = `SELECT * FROM orders ORDER BY orderDate DESC`;

const getOrderById = `SELECT * FROM orders WHERE id = ?`;

const getOrderItemsByOrderId = `
  SELECT oi.*, pv.id AS variantId, pv.SKU, pv.variantName, pv.price, pv.stockQnt,
         p.id AS productId, p.name AS productName
  FROM order_items oi
  JOIN product_variants pv ON oi.variantId = pv.id
  JOIN products p ON pv.ProductId = p.id
  WHERE oi.orderId = ?
`;

const insertOrder = `
  INSERT INTO orders 
    (UuerId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertOrderItem = `
  INSERT INTO order_items
    (orderId, variantId, quantity, unitPrice, totalPrice)
  VALUES (?, ?, ?, ?, ?)
`;

const getOrdersByUserId = `SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`;

const getUserOrderById = `SELECT * FROM orders WHERE id = ? AND userId = ?`;

const cancelOrderById = `UPDATE orders SET status = 'Cancelled' WHERE id = ?`;

const getCategoryWiseOrders = `
  SELECT c.id AS categoryId, c.name AS categoryName, c.parentId, COUNT(oi.id) AS orderCount
  FROM order_items oi
  JOIN product_variants pv ON oi.variantId = pv.id
  JOIN products p ON pv.ProductId = p.id
  JOIN product_categories pc ON p.id = pc.productId
  JOIN categories c ON pc.categoryId = c.id
  GROUP BY c.id
`;

const getOrderStatusById = `
  SELECT id, status, deliveryMode, deliveryAddress, estimatedDeliveryDate, userId
  FROM orders
  WHERE id = ?
`;

const getTotalRevenue = `SELECT SUM(totalPrice) AS totalRevenue FROM orders`;

// --- Stripe webhook related queries ---
// const updateOrderStatus = `
//   UPDATE orders
//   SET status = ?, cancelReason = ?, updatedAt = NOW()
//   WHERE id = ?
// `;
const updateOrderStatus = `
  UPDATE orders
  SET status = ?, cancelReason = ?
  WHERE id = ?
`;

// const updatePaymentStatus = `
//   UPDATE payments
//   SET status = ?, paymentIntentId = ?, updatedAt = NOW()
//   WHERE id = ?
// `;
const updatePaymentStatus = `
  UPDATE payments
  SET status = ?, paymentIntentId = ?
  WHERE id = ?
`;

const restockItems = `
  UPDATE product_variants v
  JOIN order_items oi ON v.id = oi.variantId
  SET v.stockQnt = v.stockQnt + oi.quantity
  WHERE oi.orderId = ?
`;
const getPaymentByOrderId = `SELECT * FROM payments WHERE orderId = ?`;

// Get order details (items)
const getOrderDetailsByOrderId = `
  SELECT oi.id AS orderItemId, p.name AS productName, oi.quantity, oi.price
  FROM order_items oi
  JOIN products p ON oi.productId = p.id
  WHERE oi.orderId = ?;
`;
module.exports = {
  getAllOrders,
  getOrderById,
  getOrderItemsByOrderId,
  insertOrder,
  insertOrderItem,
  getOrdersByUserId,
  getUserOrderById,
  cancelOrderById,
  getCategoryWiseOrders,
  getTotalRevenue,
  getOrderStatusById,
  updateOrderStatus,
  updatePaymentStatus,
  restockItems,
  getPaymentByOrderId,
  getOrderDetailsByOrderId,
};
