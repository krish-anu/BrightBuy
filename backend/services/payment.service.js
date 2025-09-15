const db = require('../models');
const Payment = db.payment;

const createPayment = async (orderId, totalAmount, paymentMethod, userId, transaction, paymentIntentId = null) => {
    return await Payment.create({
        orderId,
        amount: totalAmount,
        paymentMethod,
        status: 'Pending',
        userId,
        paymentIntentId
    }, { transaction });
};

module.exports = {
    createPayment,
};
