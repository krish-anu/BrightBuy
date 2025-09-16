// deliveryQueries.js

// Get delivery by ID
const getDeliveryById = `
  SELECT * FROM deliveries WHERE id = ?;
`;

// Get delivery with order and payment
const getDeliveryWithOrderPayment = `
  SELECT d.*, o.id AS orderId, o.status AS orderStatus, p.id AS paymentId, p.status AS paymentStatus
  FROM deliveries d
  JOIN orders o ON d.orderId = o.id
  JOIN payments p ON o.id = p.orderId
  WHERE d.id = ?;
`;

// Get delivery staff by ID
const getUserById = `
  SELECT id, role FROM users WHERE id = ?;
`;

// Update delivery
const updateDelivery = `
  UPDATE deliveries
  SET staffId = ?, status = ?, assignedDate = ?
  WHERE id = ?;
`;

// Update delivery status only
const updateDeliveryStatus = `
  UPDATE deliveries
  SET status = ?, deliveryDate = ?
  WHERE id = ?;
`;

// Update order status
const updateOrderStatus = `
  UPDATE orders
  SET status = ?
  WHERE id = ?;
`;

// Get order items for an order
const getOrderItemsByOrderId = `
  SELECT oi.id, oi.quantity, oi.preOrdered, oi.variantId, pv.stockQnt
  FROM order_items oi
  JOIN product_variants pv ON oi.variantId = pv.id
  WHERE oi.orderId = ?;
`;

// Update order item preOrdered flag
const markOrderItemsProcessed = (itemIds) => {
  const placeholders = itemIds.map(() => '?').join(',');
  return `UPDATE order_items SET preOrdered = FALSE WHERE id IN (${placeholders});`;
};

module.exports = {
  getDeliveryById,
  getDeliveryWithOrderPayment,
  getUserById,
  updateDelivery,
  updateDeliveryStatus,
  updateOrderStatus,
  getOrderItemsByOrderId,
  markOrderItemsProcessed,
};
