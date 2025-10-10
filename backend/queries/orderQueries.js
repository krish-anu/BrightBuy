// Orders Queries
const getAllOrders = `
  SELECT o.*, 
         u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
  FROM orders o
  LEFT JOIN users u ON o.userId = u.id
  ORDER BY o.orderDate DESC
`;

const getOrderById = `
  SELECT o.*, 
         u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
  FROM orders o
  LEFT JOIN users u ON o.userId = u.id
  WHERE o.id = ?
`;

const getOrderItemsByOrderId = `
  SELECT oi.*, pv.id AS variantId, pv.SKU, pv.variantName, pv.price, pv.stockQnt,
         p.id AS productId, p.name AS productName
  FROM order_items oi
  JOIN product_variants pv ON oi.variantId = pv.id
  JOIN products p ON pv.productId = p.id
  WHERE oi.orderId = ?
`;

const insertOrder = `
  INSERT INTO orders 
    (userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status)
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
  SELECT 
    c.id AS categoryId, 
    c.name AS categoryName, 
    c.parentId, 
    COALESCE(COUNT(oi.id), 0) AS orderCount
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  LEFT JOIN products p ON pc.productId = p.id
  LEFT JOIN product_variants pv ON p.id = pv.productId
  LEFT JOIN order_items oi ON pv.id = oi.variantId
  WHERE c.isMainCategory = TRUE
  GROUP BY c.id, c.name, c.parentId
  ORDER BY orderCount DESC, c.name ASC
`;

const getOrderStatusById = `
  SELECT id, status, deliveryMode, deliveryAddress, estimatedDeliveryDate, userId
  FROM orders
  WHERE id = ?
`;

// Orders assigned to a delivery staff (via deliveries.staffId)
const getOrdersAssignedToStaff = `
  SELECT o.*, 
         u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
  FROM orders o
  JOIN deliveries d ON d.orderId = o.id
  LEFT JOIN users u ON o.userId = u.id
  WHERE d.staffId = ?
  ORDER BY o.orderDate DESC
`;

// Get orders with status 'Shipped' (include delivery info)
const getShippedOrders = `
  SELECT o.*, 
         u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone,
         d.id AS deliveryId, d.status AS deliveryStatus, d.staffId AS deliveryStaffId
  FROM orders o
  LEFT JOIN deliveries d ON d.orderId = o.id
  LEFT JOIN users u ON o.userId = u.id
  WHERE o.status = 'Shipped'
  ORDER BY o.orderDate DESC
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
  JOIN product_variants pv ON oi.variantId = pv.id
  JOIN products p ON oi.productId = p.id
  WHERE oi.orderId = ?;
`;

const getTotalOrders = `SELECT COUNT(*) AS totalOrders FROM orders`;

const getOrderStatusCounts = `
  SELECT 
    status,
    COUNT(*) AS count
  FROM orders 
  GROUP BY status
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
  getOrdersAssignedToStaff,
  getShippedOrders,
  updateOrderStatus,
  updatePaymentStatus,
  restockItems,
  getPaymentByOrderId,
  getOrderDetailsByOrderId,
  getTotalOrders,
  getOrderStatusCounts
};
