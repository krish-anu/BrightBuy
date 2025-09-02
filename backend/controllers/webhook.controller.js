const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const db = require("../models");
const { addOrderItems, getOrderDetails } = require("../services/order.service");

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const Order = db.order;
const Payment = db.payment;

const stripeWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        if (!sig) throw new ApiError('Missing stripe signature', 400);

        let event;
        try {
            // req.body should be raw Buffer here, not parsed JSON
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new ApiError('Webhook signature verification failed', 400);
        }

        console.log('Received webhook event:', event.type);
        await db.sequelize.transaction(async t => {
            const session = event.data.object;
            const orderId = session.metadata.orderId;
            const order = await Order.findByPk(orderId, { transaction: t });
            const userId = session.metadata.userId;
            if (order.userId.toString() !== userId.toString()) throw new ApiError('Order user mismatch', 400);
            const payment = await Payment.findOne({ where: { orderId } }, { transaction: t });
            switch (event.type) {
                case 'checkout.session.completed': {
                    await order.update({ status: 'Confirmed' }, { transaction: t })
                    await payment.update({ status: 'Paid', paymentIntentId: session.payment_intent }, { transaction: t })
                    const finalOrder=await getOrderDetails(order.id)
                    res.status(200).json({ success: true, data: finalOrder })
                    break;
                }
                case 'payment_intent.payment_failed': {
                    await order.update({ status: 'Cancelled' ,cancelReason:'PaymentFailed'}, { transaction: t });
                    await payment.update({ status: 'Cancelled' }, { transaction: t });
                    await restock(orderId,t)
                    res.status(200).json({ success: false, data: payment })
                    break;
                }
                case 'checkout.session.expired': {
                    await order.update({ status: 'Cancelled',cancelReason:'Expired' }, { transaction: t });
                    await payment.update({ status: 'Cancelled' }, { transaction: t });
                    await restock(orderId,t)
                    res.status(200).json({ success: false, data: payment })
                    break;
                }
            }
        })
    } catch (error) {
        next(error);
    }
};

module.exports = { stripeWebhook };
