// controllers/stripeWebhook.controller.js
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const pool = require("../config/db");
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const orderQueries = require('../queries/orderQueries');
const { getOrderDetails } = require('../services/order.service');

const stripeWebhook = async (req, res, next) => {
  let connection;
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

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const orderId = session.metadata.orderId;
        const userId = session.metadata.userId;

        const [orderRows] = await connection.query(orderQueries.getOrderById, [orderId]);
        if (!orderRows.length) throw new ApiError('Order not found', 404);
        const order = orderRows[0];

        if (order.userId.toString() !== userId.toString()) throw new ApiError('Order user mismatch', 400);

        const [paymentRows] = await connection.query(orderQueries.getPaymentByOrderId, [orderId]);
        if (!paymentRows.length) throw new ApiError('Payment record not found', 404);
        const payment = paymentRows[0];

        // Update order status
        await connection.query(orderQueries.updateOrderStatus, ['Confirmed', null, orderId]);

        // Update payment status
        await connection.query(orderQueries.updatePaymentStatus, ['Paid', session.payment_intent, payment.id]);

        const finalOrder = await getOrderDetails(order.id, connection);
        await connection.commit();
        res.status(200).json({ success: true, data: finalOrder });
        break;
      }

      case 'payment_intent.payment_failed':
      case 'checkout.session.expired': {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          await connection.commit();
          return res.status(200).json({ received: true });
        }

        const [orderRows] = await connection.query(orderQueries.getOrderById, [orderId]);
        if (!orderRows.length) {
          await connection.commit();
          return res.status(200).json({ received: true });
        }
        const order = orderRows[0];

        const [paymentRows] = await connection.query(orderQueries.getPaymentByOrderId, [orderId]);
        if (!paymentRows.length) {
          await connection.commit();
          return res.status(200).json({ received: true });
        }
        const payment = paymentRows[0];

        // Update order to Cancelled
        await connection.query(orderQueries.updateOrderStatus, [
          'Cancelled',
          event.type === 'payment_intent.payment_failed' ? 'PaymentFailed' : 'Expired',
          orderId
        ]);

        // Update payment to Failed
        await connection.query(orderQueries.updatePaymentStatus, ['Failed', null, payment.id]);

        // Restock items
        await connection.query(orderQueries.restockItems, [orderId]);

        await connection.commit();
        res.status(200).json({ success: false, message: 'Payment failed, order cancelled' });
        break;
      }

      default:
        console.log(`Ignoring event type: ${ event.type }`);
        await connection.commit();
        res.status(200).json({ received: true });
    }
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { stripeWebhook };
