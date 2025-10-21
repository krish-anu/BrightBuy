const { query ,pool} = require('../config/db');
const ApiError = require('../utils/ApiError');
const orderQueries = require('../queries/orderQueries');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const { restock } = require('../services/order.service');

const getPayments =async(req, res, next) => {
  try {
    const payments = await query(`SELECT * FROM payments`)
    res.status(200).json({success:true,data:payments})
  } catch (error) {
    next(error)
 }
}

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

      // Mark payment as Paid and persist paymentIntentId/session id
      const paymentRows = await query(orderQueries.getPaymentByOrderId, [orderId]);
      if (paymentRows.length) {
        const paymentId = paymentRows[0].id;
        const intent = session.payment_intent || session.id || null;
        await query(orderQueries.updatePaymentStatus, ['Paid', intent, paymentId]);
      }

      // Keep order status as Pending (no change) per current business rule
      const order = orderRows[0];
      return res.status(200).json({ success: true, data: { paymentStatus: 'paid', order } });
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
        // updatePaymentStatus expects (status, paymentIntentId, id)
        await query(orderQueries.updatePaymentStatus, ['Cancelled', null, paymentRows[0].id]);
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

const handleCODPayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const paymentId = req.params.id;
    const userId = req.user.id;
    const { amount } = req.body;

    const [paymentRows] = await connection.query(
      `SELECT p.*, o.id AS orderId, o.userId AS orderUserId, o.status AS orderStatus
       FROM payments p
       INNER JOIN orders o ON o.id = p.orderId
       WHERE p.id = ?`,
      [paymentId]
    );
    if (!paymentRows.length) throw new ApiError('Payment not found', 404);
    const payment = paymentRows[0];

    const [deliveryRows] = await connection.query(
      `SELECT * FROM deliveries WHERE orderId = ?`,
      [payment.orderId]
    );
    if (!deliveryRows.length) throw new ApiError('Delivery not found', 404);
    const delivery = deliveryRows[0];
    if (delivery.staffId !== userId) {
      throw new ApiError('Forbidden access', 403);
    }
    if (parseFloat(payment.amount) !== parseFloat(amount)) {
      throw new ApiError('Invalid payment amount', 400);
    }
    await connection.query(
      `UPDATE payments SET status = ? WHERE id = ?`,
      ['Paid', payment.id]
    );
    await connection.query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      ['Delivered', payment.orderId]
    );
    await connection.query(
      `UPDATE deliveries SET status = ?, deliveryDate = ? WHERE id = ?`,
      ['Delivered', new Date(), delivery.id]
    );

    await connection.commit();
    res.status(200).json({ success: true, message: 'COD payment processed successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};


module.exports = {
    successPayment,
    cancelledPayment,
    checkPaymentStatus,
    getPayments,
    handleCODPayment
};
