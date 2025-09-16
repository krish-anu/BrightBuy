// Get order by ID
const getOrderById = `SELECT * FROM orders WHERE id = ?`;

// Update order status
const updateOrderStatus = `UPDATE orders SET status = ?, cancelReason = ? WHERE id = ?`;

// Get payment by orderId
const getPaymentByOrderId = `SELECT * FROM payments WHERE orderId = ?`;

// Update payment status
const updatePaymentStatus = `UPDATE payments SET status = ? WHERE id = ?`;

module.exports = {
  getOrderById,
  updateOrderStatus,
  getPaymentByOrderId,
  updatePaymentStatus
};

