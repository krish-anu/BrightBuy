// // const pool  = require('../config/db'); // your MySQL connection/pool
// const { pool, query } = require('../config/db');


// const createPayment = async (userId,orderId, totalPrice, deliveryCharge, paymentMethod, paymentIntentId) => {
//   const amount = parseFloat(totalPrice) + parseFloat(deliveryCharge);
//   const status = paymentIntentId ? 'Paid' : 'Pending';
//   if (paymentMethod === 'CashOnDelivery')
//     paymentMethod='COD'
//   const sql = `
//     INSERT INTO payments
//       (userId,orderId, amount, paymentMethod, status, paymentIntentId)
//     VALUES (?,?, ?, ?, ?, ?)
//   `;

//   const values = [userId ,orderId, amount, paymentMethod, status, paymentIntentId || null];

//   return new Promise((resolve, reject) => {
//     pool.query(sql, values, (err, results) => {
//       if (err) return reject(err);
//       resolve(results.insertId); // returns the inserted payment id
//     });
//   });
// };

// module.exports = { createPayment };
const { query } = require('../config/db');

const createPayment = async (userId, orderId, totalPrice, deliveryCharge, paymentMethod, paymentIntentId = null) => {
  const amount = parseFloat(totalPrice) + parseFloat(deliveryCharge);
  const status = paymentIntentId ? 'Paid' : 'Pending';
  if (paymentMethod === 'CashOnDelivery') paymentMethod = 'COD';

  const sql = `
    INSERT INTO payments
      (userId, orderId, amount, paymentMethod, status, paymentIntentId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [userId, orderId, amount, paymentMethod, status, paymentIntentId];

  // Use await with promise pool
  const result = await query(sql, values);
  return result.insertId;
};

module.exports = { createPayment };
