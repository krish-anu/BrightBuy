const pool = require('../config/db'); // your MySQL connection/pool

const createPayment = async (orderId, totalPrice, deliveryCharge, paymentMethod, paymentIntentId) => {
  const amount = parseFloat(totalPrice) + parseFloat(deliveryCharge);
  const status = paymentIntentId ? 'Paid' : 'Pending';

  const sql = `
    INSERT INTO payments
      (OrderId, amount, paymentMethod, status, paymentIntentId)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [orderId, amount, paymentMethod, status, paymentIntentId || null];

  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results.insertId); // returns the inserted payment id
    });
  });
};

module.exports = { createPayment };
