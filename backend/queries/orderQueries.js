// Orders Queries
const getAllOrders = `
  SELECT o.*, 
         u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone,
         d.id AS deliveryId, d.status AS deliveryStatus, d.staffId AS deliveryStaffId
  FROM orders o
  LEFT JOIN users u ON o.userId = u.id
  LEFT JOIN deliveries d ON d.orderId = o.id
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
  SELECT oi.*, pv.id AS variantId, pv.SKU, pv.variantName, pv.price AS variantPrice, pv.stockQnt,
         p.id AS productId, p.name AS productName
  FROM order_items oi
  LEFT JOIN product_variants pv ON oi.variantId = pv.id
  LEFT JOIN products p ON pv.productId = p.id
  WHERE oi.orderId = ?
`;

const insertOrder = `
  INSERT INTO orders 
    (userId, deliveryMode, deliveryAddress, totalPrice, deliveryCharge, paymentMethod, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
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
  SELECT id, status, deliveryMode, deliveryAddressId, userId, orderDate, createdAt
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

// Get order details (items) - resilient joins and correct columns
const getOrderDetailsByOrderId = `
  SELECT oi.id AS orderItemId, p.id AS productId, p.name AS productName, oi.quantity, oi.unitPrice, oi.totalPrice, pv.SKU, pv.variantName
  FROM order_items oi
  LEFT JOIN product_variants pv ON oi.variantId = pv.id
  LEFT JOIN products p ON pv.productId = p.id
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

// 4. Quarterly sales for a given year (use orderDate if present, otherwise createdAt)
// Use a derived table to avoid ONLY_FULL_GROUP_BY issues on strict MySQL modes.
const quarterlySalesByYear = `
  SELECT CONCAT('Q', t.q) AS quarter, t.y AS year, COUNT(*) AS totalOrders, SUM(t.totalPrice) AS totalSales
  FROM (
    SELECT YEAR(COALESCE(orderDate, createdAt)) AS y,
           QUARTER(COALESCE(orderDate, createdAt)) AS q,
           totalPrice
    FROM orders
    WHERE YEAR(COALESCE(orderDate, createdAt)) = ?
      AND status != 'Cancelled'
  ) t
  GROUP BY t.y, t.q
  ORDER BY t.q;
`;

// 5. Top selling products in a given period (startDate, endDate, limit)
// Use LEFT JOIN so products with zero sales still appear (totalSold = 0)
const topSellingProductsBetween = `
  SELECT p.id AS productId, p.name AS productName, COALESCE(s.totalSold, 0) AS totalSold
  FROM products p
  LEFT JOIN (
    SELECT pv.productId AS productId, SUM(oi.quantity) AS totalSold
    FROM order_items oi
    JOIN product_variants pv ON oi.variantId = pv.id
    JOIN orders o ON oi.orderId = o.id
    WHERE COALESCE(o.orderDate, o.createdAt) BETWEEN ? AND ?
      AND o.status != 'Cancelled'
    GROUP BY pv.productId
  ) s ON s.productId = p.id
  ORDER BY totalSold DESC, p.name ASC
  LIMIT ?;
`;

// Same as above but without LIMIT — useful when caller wants the full ranked list
const topSellingProductsBetweenNoLimit = `
  SELECT p.id AS productId, p.name AS productName, COALESCE(s.totalSold, 0) AS totalSold
  FROM products p
  LEFT JOIN (
    SELECT pv.productId AS productId, SUM(oi.quantity) AS totalSold
    FROM order_items oi
    JOIN product_variants pv ON oi.variantId = pv.id
    JOIN orders o ON oi.orderId = o.id
    WHERE COALESCE(o.orderDate, o.createdAt) BETWEEN ? AND ?
      AND o.status != 'Cancelled'
    GROUP BY pv.productId
  ) s ON s.productId = p.id
  ORDER BY totalSold DESC, p.name ASC;
`;

// 6. Customer-wise order summary and payment status
// - Include only users with role = 'Customer'
// - Consider only non-cancelled orders for spend and last order date
// - Join payments and group distinct payment statuses actually recorded
// - Limit to top 10 by totalSpent to match UI expectation
const customerOrderSummary = `
  SELECT 
    u.id AS customerId,
    u.name AS customerName,
    u.email AS customerEmail,
    COUNT(o.id) AS totalOrders,
    COALESCE(SUM(o.totalPrice), 0) AS totalSpent,
    MAX(COALESCE(o.orderDate, o.createdAt)) AS lastOrderDate,
    GROUP_CONCAT(DISTINCT p.status ORDER BY p.status SEPARATOR ',') AS paymentStatuses,
    CASE 
      WHEN COUNT(o.id) > 0 
           AND SUM(CASE WHEN p.status = 'Paid' THEN 1 ELSE 0 END) = COUNT(o.id)
        THEN 'Paid'
      ELSE 'Pending'
    END AS aggPaymentStatus
  FROM users u
  LEFT JOIN orders o 
    ON u.id = o.userId 
   AND o.status != 'Cancelled'
  LEFT JOIN payments p 
    ON o.id = p.orderId
  WHERE u.role = 'Customer'
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(o.id) > 0
  ORDER BY totalSpent DESC
  LIMIT 10;
`;

// 7. Upcoming orders with delivery estimates (Standard Delivery and not delivered/cancelled)
// Use estimatedDeliveryDate if set; otherwise add a default 3-day window from createdAt
const getUpcomingOrdersWithEstimates = `
  SELECT o.id AS orderId,
         o.orderDate,
         DATE_ADD(COALESCE(o.orderDate, o.createdAt), INTERVAL 3 DAY) AS estimatedDeliveryDate,
         o.status AS orderStatus,
         u.id AS customerId, u.name AS customerName, u.email AS customerEmail,
         d.status AS deliveryStatus
  FROM orders o
  LEFT JOIN users u ON o.userId = u.id
  LEFT JOIN deliveries d ON o.id = d.orderId
  WHERE o.deliveryMode = 'Standard Delivery'
    AND o.status NOT IN ('Delivered','Cancelled')
  ORDER BY estimatedDeliveryDate ASC, o.orderDate DESC;
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
  ,
  // New report queries
  quarterlySalesByYear,
  topSellingProductsBetween,
  topSellingProductsBetweenNoLimit,
  customerOrderSummary,
  getUpcomingOrdersWithEstimates
};
