// controllers/webhook.controller.js
const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = require("../config/dbConfig");
const ApiError = require("../utils/ApiError");
const { pool } = require("../config/db");
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const orderQueries = require('../queries/orderQueries');
const { getOrderDetails } = require('../services/order.service');

const stripeWebhook = async (req, res, next) => {
  let connection;

  try {
    // Debug logging
    console.log('=== WEBHOOK DEBUG ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body type:', typeof req.body);
    console.log('Body is Buffer:', Buffer.isBuffer(req.body));
    console.log('Body length:', req.body?.length);
    console.log('Signature present:', !!req.headers['stripe-signature']);
    console.log('Webhook secret configured:', STRIPE_WEBHOOK_SECRET ? 'YES' : 'NO');
    console.log('Webhook secret starts with whsec_:', STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'));

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('ERROR: Missing stripe-signature header');
      throw new ApiError('Missing stripe signature', 400);
    }

    let event;

    try {
      // Stripe expects a Buffer or string here
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
      console.log('✓ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook verification failed');
      console.error('Error message:', err.message);
      console.error('Error type:', err.type);
      console.error('Full error:', err);
      throw new ApiError(`Webhook signature verification failed: ${ err.message }`, 400);
    }

    console.log('Received webhook event type:', event.type);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Processing checkout.session.completed');
        const orderId = session.metadata.orderId;
        const userId = session.metadata.userId;

        console.log('Order ID:', orderId);
        console.log('User ID:', userId);

        const [orderRows] = await connection.execute(orderQueries.getOrderById, [orderId]);
        if (!orderRows.length) throw new ApiError('Order not found', 404);

        const order = orderRows[0];
        if (order.userId.toString() !== userId.toString()) {
          throw new ApiError('Order user mismatch', 400);
        }

        const [paymentRows] = await connection.execute(
          orderQueries.getPaymentByOrderId,
          [orderId]
        );
        if (!paymentRows.length) throw new ApiError('Payment record not found', 404);

        const payment = paymentRows[0];

        await connection.execute(
          orderQueries.updateOrderStatus,
          ['Confirmed', null, orderId]
        );

        await connection.execute(
          orderQueries.updatePaymentStatus,
          ['Paid', session.payment_intent, payment.id]
        );

        const finalOrder = await getOrderDetails(order.id, connection);
        await connection.commit();

        console.log('✓ Order confirmed successfully');
        return res.status(200).json({ success: true, data: finalOrder });
      }

      case 'payment_intent.payment_failed':
      case 'checkout.session.expired': {
        console.log('Processing payment failure/expiration');
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.log('No orderId in metadata, ignoring');
          await connection.commit();
          return res.status(200).json({ received: true });
        }

        const [orderRows] = await connection.execute(orderQueries.getOrderById, [orderId]);
        if (!orderRows.length) {
          console.log('Order not found, ignoring');
          await connection.commit();
          return res.status(200).json({ received: true });
        }

        const order = orderRows[0];
        const [paymentRows] = await connection.execute(
          orderQueries.getPaymentByOrderId,
          [orderId]
        );

        if (!paymentRows.length) {
          console.log('Payment not found, ignoring');
          await connection.commit();
          return res.status(200).json({ received: true });
        }

        const payment = paymentRows[0];

        await connection.execute(orderQueries.updateOrderStatus, [
          'Cancelled',
          event.type === 'payment_intent.payment_failed' ? 'PaymentFailed' : 'Expired',
          orderId
        ]);

        await connection.execute(
          orderQueries.updatePaymentStatus,
          ['Failed', null, payment.id]
        );

        await connection.execute(orderQueries.restockItems, [orderId]);
        await connection.commit();

        console.log('✓ Order cancelled and items restocked');
        return res.status(200).json({
          success: false,
          message: 'Payment failed, order cancelled'
        });
      }

      default:
        console.log(`Ignoring unhandled event type: ${ event.type }`);
        await connection.commit();
        return res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('ERROR in webhook handler:', error);
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { stripeWebhook };