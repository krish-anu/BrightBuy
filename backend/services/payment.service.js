const db = require('../models');
const Payment = db.payment;

const createPayment = async (orderId, totalPrice, deliveryCharge, paymentMethod, paymentIntentId, transaction) => {
    await Payment.create({
        orderId: orderId,
        amount: parseFloat(totalPrice) + parseFloat(deliveryCharge),
        paymentMethod: paymentMethod,
        status: paymentIntentId ? 'Paid' : 'Pending',
        paymentIntentId
    }, { transaction });
};



module.exports={createPayment}