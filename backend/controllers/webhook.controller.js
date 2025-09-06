const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const db = require("../models");
const { getOrderDetails, restock } = require("../services/order.service"); // Added restock import

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const Order = db.order;
const Payment = db.payment;

const stripeWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        if (!sig) throw new ApiError('Missing stripe signature', 400);

        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook verification failed:', err.message);
            throw new ApiError('Webhook signature verification failed', 400);
        }

        console.log('Received webhook:', event.type);

        await db.sequelize.transaction(async t => {
            const session = event.data.object;

            switch (event.type) {
                case 'checkout.session.completed': {
                    const orderId = session.metadata.orderId;
                    const userId = session.metadata.userId;

                    const order = await Order.findByPk(orderId, { transaction: t });
                    if (!order) throw new ApiError('Order not found', 404);
                    if (order.userId.toString() !== userId.toString()) throw new ApiError('Order user mismatch', 400);

                    const payment = await Payment.findOne({ where: { orderId }, transaction: t });
                    if (!payment) throw new ApiError('Payment record not found', 404);

                    // Update order status to Confirmed
                    await order.update({ status: 'Confirmed' }, { transaction: t });

                    // Update payment status to Paid and add payment intent ID
                    await payment.update({
                        status: 'Paid',
                        paymentIntentId: session.payment_intent
                    }, { transaction: t });

                    const finalOrder = await getOrderDetails(order.id, t);
                    res.status(200).json({ success: true, data: finalOrder });
                    break;
                }

                case 'payment_intent.payment_failed':
                case 'checkout.session.expired': {
                    const orderId = session.metadata?.orderId;
                    if (!orderId) {
                        console.log('No orderId in metadata, skipping');
                        res.status(200).json({ received: true });
                        break;
                    }

                    const order = await Order.findByPk(orderId, { transaction: t });
                    if (!order) {
                        console.log('Order not found, skipping');
                        res.status(200).json({ received: true });
                        break;
                    }

                    const payment = await Payment.findOne({ where: { orderId }, transaction: t });
                    if (!payment) {
                        console.log('Payment not found, skipping');
                        res.status(200).json({ received: true });
                        break;
                    }

                    // Update order status to Cancelled with reason
                    await order.update({
                        status: 'Cancelled',
                        cancelReason: event.type === 'payment_intent.payment_failed' ? 'PaymentFailed' : 'Expired'
                    }, { transaction: t });

                    // Update payment status to Failed
                    await payment.update({ status: 'Failed' }, { transaction: t });

                    // Restock items that were not backordered
                    await restock(order.id, t);

                    res.status(200).json({ success: false, message: 'Payment failed, order cancelled' });
                    break;
                }

                default:
                    console.log(`Ignoring event type: ${ event.type }`);
                    res.status(200).json({ received: true });
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { stripeWebhook };
