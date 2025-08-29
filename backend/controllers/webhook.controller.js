// controllers/webhook.controller.js
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const db = require("../models");

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

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const pendingOrderId = session.metadata.orderId;

            await db.sequelize.transaction(async (t) => {
                const order = await Order.findByPk(pendingOrderId, { transaction: t });
                if (!order) throw new ApiError('Order not found', 404);
                if (order.userId.toString() !== userId.toString()) throw new ApiError('Order user mismatch', 400);

                await order.update({
                    status: 'Confirmed',
                    paymentMethod: 'Card',
                    paymentIntentId: session.payment_intent,
                }, { transaction: t });

                await Payment.update(
                    { status: 'Paid', paymentIntentId: session.payment_intent },
                    { where: { orderId: pendingOrderId }, transaction: t }
                );
            });

            console.log('Order confirmed after stripe payment');
        }

        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            const pendingOrderId = session.metadata.orderId;

            await db.sequelize.transaction(async (t) => {
                await Order.update({
                    status: 'Cancelled'
                }, { where: { id: pendingOrderId }, transaction: t });

                await Payment.update(
                    { status: 'Cancelled' },
                    { where: { orderId: pendingOrderId }, transaction: t }
                );
            });

            console.log('Order cancelled due to session expiry');
        }

        res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
};

module.exports = { stripeWebhook };
