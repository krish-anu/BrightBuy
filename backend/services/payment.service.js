
const createPayment = async (userId, orderId, totalPrice, deliveryCharge, paymentMethod,connection, paymentIntentId = null) => {
  const amount = parseFloat(totalPrice) + parseFloat(deliveryCharge);
  const status = paymentIntentId ? 'Paid' : 'Pending';
  if (paymentMethod === 'CashOnDelivery') paymentMethod = 'COD';

  const sql = `
    INSERT INTO payments
      (userId, orderId, amount, paymentMethod, status, paymentIntentId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [userId, orderId, amount, paymentMethod, status, paymentIntentId];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

module.exports = { createPayment };
