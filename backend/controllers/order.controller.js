const { query } = require('../config/db');
const orderQueries = require('../queries/orderQueries');
const ApiError = require('../utils/ApiError');
const { calculateOrderDetails } = require('../utils/calculateOrderDetails');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const { saveOrderToDatabase } = require('../services/order.service');
const { createPayment } = require('../services/payment.service');
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Helper function to save order and items
async function createOrderInDB(orderedItems, userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod) {
  const result = await query(orderQueries.insertOrder, [
    userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, 'Pending'
  ]);
  const orderId = result.insertId;

  for (const item of orderedItems) {
    await query(orderQueries.insertOrderItem, [
      orderId, item.variantId, item.quantity, item.price, item.price * item.quantity
    ]);
  }

  return { id: orderId, UserId: userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod, status: 'Pending' };
}

// Get all orders
const getOrders = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getAllOrders);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Get single order by ID
const getOrder = async (req, res, next) => {
  try {
    const orders = await query(orderQueries.getOrderById, [req.params.id]);
    if (!orders.length) throw new ApiError('Order not found', 404);

    const orderItems = await query(orderQueries.getOrderItemsByOrderId, [req.params.id]);
    res.status(200).json({ success: true, data: { ...orders[0], items: orderItems } });
  } catch (err) { next(err); }
};

// Add order
const addOrder = async (req, res, next) => {
  try {
    const { items, paymentMethod, deliveryMode, deliveryAddress } = req.body;
    if (!items || !deliveryMode || !paymentMethod) throw new ApiError('Items, delivery mode, and payment method are required', 400);
    // delivery address required?
    if (deliveryMode === 'Store Pickup' && paymentMethod === 'CashOnDelivery')
      throw new ApiError('Invalid payment method',400)
    const address = deliveryAddress || null;
    const { totalPrice, deliveryCharge, deliveryDate, finalAddress, orderedItems } =
      await calculateOrderDetails(items, deliveryMode, address, { id: req.user.id });

    const order = await saveOrderToDatabase(
      orderedItems,
      req.user.id,
      deliveryMode,
      finalAddress,
      deliveryDate,
      totalPrice,
      deliveryCharge,
      paymentMethod
    );
    const totalAmount = totalPrice + deliveryCharge;
    await createPayment(req.user.id, order.id, totalAmount, deliveryCharge, paymentMethod);

    if (deliveryMode === 'Standard Delivery') {
      await query(
        `INSERT INTO deliveries (orderId) VALUES (?)`,
        [order.id]
      );
    }

    if (paymentMethod === 'CashOnDelivery') return res.status(201).json({ success: true, data: order });

    if (paymentMethod === 'Card') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: orderedItems.map(item => ({
          price_data: { currency: 'lkr', product_data: { name: item.productName }, unit_amount: Math.round(item.price * 100) },
          quantity: item.quantity
        })),
        mode: 'payment',
        success_url: `http://localhost:8081/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:8081/payment/cancel`,
        metadata: { userId: req.user.id, orderId: order.id }
      });
      return res.status(200).json({ success: true, data: { sessionId: session.id } });
    }

    throw new ApiError('Invalid payment method', 400);
  } catch (err) { next(err); }
};

// Get orders of a user
const getUserOrders = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getOrdersByUserId, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Get a user order
const getUserOrder = async (req, res, next) => {
  try {
    const orders = await query(orderQueries.getUserOrderById, [req.params.id, req.user.id]);
    if (!orders.length) throw new ApiError('Order not found', 404);

    const orderItems = await query(orderQueries.getOrderItemsByOrderId, [req.params.id]);
    res.status(200).json({ success: true, data: { ...orders[0], items: orderItems } });
  } catch (err) { next(err); }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  try {
    await query(orderQueries.cancelOrderById, [req.params.id]);
    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) { next(err); }
};

// Get category-wise orders
const getCategoryWiseOrders = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getCategoryWiseOrders);

    const categoryOrders = {};
    let totalOrders = 0;
    for (const row of rows) {
      const parent = row.parentId;
      const child = row.categoryId;
      const count = parseInt(row.orderCount);
      if (parent !== null) {
        if (!categoryOrders[parent]) categoryOrders[parent] = { category: 'Parent', totalOrders: 0, subcategories: {} };
        categoryOrders[parent].totalOrders += count;
        categoryOrders[parent].subcategories[child] = { categoryName: row.categoryName, order: count };
      }
      totalOrders += count;
    }

    res.status(200).json({ success: true, data: { categoryOrders, totalOrders } });
  } catch (err) { next(err); }
};

// Get total revenue
const getTotalRevenue = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getTotalRevenue);
    res.status(200).json({ success: true, data: rows[0].totalRevenue || 0 });
  } catch (err) { next(err); }
};
// Get order status
const getOrderStatus = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getOrderStatusById, [req.params.id]);
    if (!rows.length) throw new ApiError('Order not found', 404);

    const order = rows[0];
    const result = { id: order.id, status: order.status };

    if (['Cancelled', 'Delivered'].includes(order.status)) {
      return res.status(200).json({ success: true, data: result });
    }

    if (order.deliveryMode === 'Standard Delivery') {
      result.deliveryAddress = order.deliveryAddress;
      result.estimatedDeliveryDate = order.estimatedDeliveryDate;
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteOrders = async (req, res, next) => {
  try {
    await query('DELETE FROM orders')
    await query('DELETE FROM payments')
  } catch (error) {
    next(error)
  }
}
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
  getOrders,
  getOrder,
  addOrder,
  getUserOrders,
  cancelOrder,
  getCategoryWiseOrders,
  getTotalRevenue,
  getOrderStatus,
  deleteOrders,
};
