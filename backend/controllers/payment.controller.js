const db = require('../models');
const ApiError = require('../utils/ApiError');
const { getOrderDetails, updateStatus } = require('../services/order.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { order: Order,
  payment: Payment,
  delivery: Delivery, } = db;

const successPayment = async (req, res, next) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) throw new ApiError('Session ID is required', 400);

        const result = await db.sequelize.transaction(async t => {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            const orderId = session.metadata?.orderId;
            if (!orderId) throw new ApiError('Invalid session - no order info', 400);

            const order = await Order.findByPk(orderId,{ transaction: t });
            if (!order) throw new ApiError('Order not found', 404);

            if (req.user && order.userId !== req.user.id) throw new ApiError('Unauthorized', 403);

            // if (session.payment_status === 'paid') {
            //     const payment = await Payment.findOne({ where: { orderId }, transaction: t });
            //     await payment.update({ status: 'Paid' }, { transaction: t });
            //     await order.update({ status: 'Confirmed' }, { transaction: t });
            // }

            return {
                paymentStatus: session.payment_status,
                order: await getOrderDetails(orderId, t)
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const cancelledPayment = async (req, res, next) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) throw new ApiError('Session ID is required', 400);

        const result = await db.sequelize.transaction(async t => {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            const orderId = session.metadata?.orderId;
            if (!orderId) return { message: 'No order linked to this session' };

            const order = await Order.findByPk(orderId, { transaction: t });
            if (!order) throw new ApiError('Order not found', 404);

            if (order.status !== 'Cancelled') {
                const payment = await Payment.findOne({ where: { orderId }, transaction: t });
                await updateStatus(order, payment, 'User Cancelled', t);

                if (order.deliveryMode === 'Standard Delivery') {
                    const delivery = await Delivery.findOne({ where: { orderId }, transaction: t });
                    if (delivery) await delivery.update({ status: 'Returned' }, { transaction: t });
                }
            }
            return { message: 'Order cancelled successfully' };
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const checkPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const result = await db.sequelize.transaction(async t => {
            const order = await Order.findByPk(orderId, { transaction: t });
            if (!order) throw new ApiError('Order not found', 404);

            const payment = await Payment.findOne({ where: { orderId }, transaction: t });
            return {
                orderStatus: order.status,
                paymentStatus: payment?.status || 'Not Found',
                orderDetails: await getOrderDetails(orderId, t)
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    successPayment,
    cancelledPayment,
    checkPaymentStatus
};
