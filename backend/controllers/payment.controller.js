const db = require('../models');
const Order = db.order;
const ApiError = require('../utils/ApiError');
const Payment = db.payment;
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const { getOrderDetails, restock } = require('../services/order.service');
const stripe = require('stripe')(STRIPE_SECRET_KEY);

const successPayment = async (req, res, next) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
            throw new ApiError('Session ID is required', 400);
        }

        const result = await db.sequelize.transaction(async t => {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                const orderId = session.metadata.orderId;
                const order = await getOrderDetails(orderId, t);
                return { paymentStatus: session.payment_status, order };
            }

            return { paymentStatus: session.payment_status };
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const cancelledPayment = async (req, res, next) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
            throw new ApiError('Session ID is required', 400);
        }

        await db.sequelize.transaction(async t => {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            const { orderId, userId } = session.metadata;

            if (!orderId) {
                return res.status(200).json({ success: true, message: 'No order to cancel' });
            }

            const order = await Order.findByPk(orderId, { transaction: t });
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Only cancel if order is still pending
            if (order.status === 'Pending') {
                await order.update({
                    status: 'Cancelled',
                    cancelReason: 'UserCancelled'
                }, { transaction: t });

                const payment = await Payment.findOne({ where: { orderId }, transaction: t });
                if (payment) {
                    await payment.update({ status: 'Cancelled' }, { transaction: t });
                }

                // Restock items that were not backordered
                await restock(orderId, t);
            }

            res.status(200).json({
                success: true,
                message: 'Payment cancelled successfully',
                orderStatus: order.status
            });
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    successPayment,
    cancelledPayment,
};