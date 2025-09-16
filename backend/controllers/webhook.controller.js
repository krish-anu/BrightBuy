// controllers/stripeWebhook.controller.js
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const db = require("../models");
const { getOrderDetails, } = require("../services/order.service"); 
const { restock, }=require('../services/variant.service')

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

        let responseData;

        await db.sequelize.transaction(async t => {
            const session = event.data.object;

            switch (event.type) {
                case 'checkout.session.completed': {
                    const orderId = session.metadata?.orderId;
                    const userId = session.metadata?.userId;
                    if (!orderId || !userId) {
                        console.log('Missing metadata in session');
                        responseData = { received: true };
                        break;
                    }

                    const order = await Order.findByPk(orderId, { transaction: t });
                    if (!order) {
                        console.log(`Order ${ orderId } not found`);
                        responseData = { received: true };
                        break;
                    }
                    if (order.userId.toString() !== userId.toString()) {
                        throw new ApiError('Order user mismatch', 400);
                    }

                    const payment = await Payment.findOne({ where: { orderId }, transaction: t });
                    if (!payment) {
                        console.log(`Payment record for order ${ orderId } not found`);
                        responseData = { received: true };
                        break;
                    }
                    if (payment.status === 'Pending') {
                        await order.update({ status: 'Confirmed' }, { transaction: t });
                        await payment.update(
                            {
                                status: 'Paid',
                                paymentIntentId: session.payment_intent,
                            },
                            { transaction: t }
                        );
                    }
                    const finalOrder = await getOrderDetails(order.id, t);
                    responseData = { success: true, data: finalOrder };
                    break;
                }
                case 'payment_intent.payment_failed':
                case 'checkout.session.expired': {
                    const orderId = session.metadata?.orderId;
                    if (!orderId) {
                        console.log('No orderId in metadata, skipping');
                        responseData = { received: true };
                        break;
                    }

                    const order = await Order.findByPk(orderId, { transaction: t });
                    if (!order) {
                        console.log(`Order ${ orderId } not found, skipping`);
                        responseData = { received: true };
                        break;
                    }
                    if (order.status === 'Pending') {
                        const payment = await Payment.findOne({
                            where: { orderId },
                            transaction: t
                        });

                        await order.update(
                            {
                                status: 'Cancelled',
                                cancelReason: event.type === 'payment_intent.payment_failed'
                                    ? 'PaymentFailed'
                                    : 'Expired'
                            },
                            { transaction: t }
                        );

                        if (payment) {
                            await payment.update({
                                status: 'Failed',
                            }, { transaction: t });
                        }

                        await restock(order.id, t);
                    }

                    responseData = { success: false, message: 'Payment failed, order cancelled' };
                    break;
                }

                default:
                    console.log(`Ignoring event type: ${ event.type }`);
                    responseData = { received: true };
            }
        });

        res.status(200).json(responseData);
    } catch (error) {
        next(error);
    }
};

module.exports = { stripeWebhook };
