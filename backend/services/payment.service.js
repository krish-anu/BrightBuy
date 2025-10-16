
const createPayment = async (userId, orderId, totalPrice, deliveryCharge, paymentMethod,connection, paymentIntentId = null) => {
  const amount = parseFloat(totalPrice) + parseFloat(deliveryCharge);
  const status = paymentIntentId ? 'Paid' : 'Pending';
  // Preserve 'CashOnDelivery' to match DB ENUM; do not change to 'COD'

  // Option A: Use stored procedure to create payment atomically
  // await connection.query(`CALL sp_create_payment(?, ?, ?, ?, ?)`, [userId, orderId, paymentMethod, amount, paymentIntentId]);
  // return orderId;

  // Option B: Keep current direct insert (default)
  const sql = `INSERT INTO payments (userId, orderId, amount, paymentMethod, status, paymentIntentId) VALUES (?, ?, ?, ?, ?, ?)`;
  const [result] = await connection.query(sql, [userId, orderId, amount, paymentMethod, status, paymentIntentId]);
  return result.insertId;
};

module.exports = { createPayment };
