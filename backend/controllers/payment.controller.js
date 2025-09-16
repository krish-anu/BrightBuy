const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const orderQueries = require('../queries/orderQueries');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const { restock } = require('../services/order.service');

// Success payment
const successPayment = async (req, res, next) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) throw new ApiError('Session ID is required', 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const orderId = session.metadata.orderId;
      const orderRows = await query(orderQueries.getOrderById, [orderId]);

      if (!orderRows.length) throw new ApiError('Order not found', 404);

      const order = orderRows[0];
      return res.status(200).json({ success: true, data: { paymentStatus: session.payment_status, order } });
    }

    return res.status(200).json({ success: true, data: { paymentStatus: session.payment_status } });
  } catch (err) {
    next(err);
  }
};

// Cancelled payment
const cancelledPayment = async (req, res, next) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) throw new ApiError('Session ID is required', 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const { orderId } = session.metadata;

    if (!orderId) {
      return res.status(200).json({ success: true, message: 'No order to cancel' });
    }

    const orderRows = await query(orderQueries.getOrderById, [orderId]);
    if (!orderRows.length) throw new ApiError('Order not found', 404);

    const order = orderRows[0];

    // Only cancel if order is still pending
    if (order.status === 'Pending') {
      await query(orderQueries.updateOrderStatus, ['Cancelled', 'UserCancelled', orderId]);

      const paymentRows = await query(orderQueries.getPaymentByOrderId, [orderId]);
      if (paymentRows.length) {
        await query(orderQueries.updatePaymentStatus, ['Cancelled', paymentRows[0].id]);
      }

      // Restock items
      await restock(orderId);
    }

    res.status(200).json({ success: true, message: 'Payment cancelled successfully', orderStatus: 'Cancelled' });
  } catch (err) {
    next(err);
  }
};
const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // 1. Fetch order
    const orderRows = await query(orderQueries.getOrderById, [orderId]);
    if (orderRows.length === 0) throw new ApiError('Order not found', 404);
    const order = orderRows[0];

    // 2. Fetch payment
    const paymentRows = await query(orderQueries.getPaymentByOrderId, [orderId]);
    const payment = paymentRows[0] || null;

    // 3. Fetch order details
    const orderDetails = await query(orderQueries.getOrderDetailsByOrderId, [orderId]);

    // 4. Build response
    const result = {
      orderStatus: order.status,
      paymentStatus: payment?.status || 'Not Found',
      orderDetails,
    };

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
