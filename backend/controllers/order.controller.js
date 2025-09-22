const { query ,pool} = require('../config/db');
const orderQueries = require('../queries/orderQueries');
const ApiError = require('../utils/ApiError');
const { calculateOrderDetails } = require('../utils/calculateOrderDetails');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const { saveOrderToDatabase, isValidUpdate } = require('../services/order.service');
const { createPayment } = require('../services/payment.service');
const { updateStock, restock } = require('../services/variant.service');
const stripe = require('stripe')(STRIPE_SECRET_KEY);


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
    if (req.user.role === 'Customer' && orders[0].userId !== req.user.id)
      throw new ApiError('Forbidden access', 403)
    const orderItems = await query(orderQueries.getOrderItemsByOrderId, [req.params.id]);
    res.status(200).json({ success: true, data: { ...orders[0], items: orderItems } });
  } catch (err) { next(err); }
};

// Add order
const addOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { items, paymentMethod, deliveryMode, deliveryAddress } = req.body;

    // Validation
    if (!items || !deliveryMode || !paymentMethod) {
      throw new ApiError('Items, delivery mode, and payment method are required', 400);
    }

    // Validate delivery address for Standard Delivery
    if (deliveryMode === 'Standard Delivery' && !deliveryAddress) {
      throw new ApiError('Delivery address is required for Standard Delivery', 400);
    }

    if (deliveryMode === 'Store Pickup' && paymentMethod === 'CashOnDelivery') {
      throw new ApiError('Invalid payment method', 400);
    }

    const address = deliveryAddress || null;

    const { totalPrice, deliveryCharge, deliveryDate, finalAddress, orderedItems } =
      await calculateOrderDetails(items, deliveryMode, address, req.user, connection);

    const order = await saveOrderToDatabase(
      orderedItems,
      req.user.id,
      deliveryMode,
      finalAddress,
      deliveryDate,
      totalPrice,
      deliveryCharge,
      paymentMethod,
      connection
    );

    await createPayment(req.user.id, order.id, totalPrice, deliveryCharge, paymentMethod, connection);

    if (deliveryMode === 'Standard Delivery') {
      await connection.query(
        `INSERT INTO deliveries (orderId) VALUES (?)`,
        [order.id]
      );
    }

    if (paymentMethod === 'CashOnDelivery') {
      await connection.commit();
      return res.status(201).json({ success: true, data: order });
    }

    if (paymentMethod === 'Card') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: orderedItems.map(item => ({
          price_data: {
            currency: 'lkr',
            product_data: { name: item.productName },
            unit_amount: Math.round(item.price * 100)
          },
          quantity: item.quantity
        })),
        mode: 'payment',
        success_url: `http://localhost:8081/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:8081/payment/cancel`,
        metadata: { userId: req.user.id.toString(), orderId: order.id.toString() }
      });

      await connection.commit();
      return res.status(200).json({ success: true, data: { sessionId: session.id } });
    }

    throw new ApiError('Invalid payment method', 400);

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }

}

// Get orders of a user
const getUserOrders = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (req.user.role==='Customer' && userId !== req.user.id) {
      throw new ApiError('Forbidden access', 403);
    }
    const rows = await query(orderQueries.getOrdersByUserId, [userId]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [orderRows] = await connection.query(
      `SELECT o.*, p.status AS paymentStatus
       FROM orders o
       LEFT JOIN payments p ON o.id = p.orderId
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!orderRows.length) throw new ApiError('Order not found', 404);
    const order = orderRows[0];

    if (req.user.role === 'Customer' && order.userId !== req.user.id) {
      throw new ApiError('Forbidden access', 403);
    }
    if ((order.paymentStatus && order.paymentStatus === 'Paid') ||
      (order.status !== 'Pending' && order.status !== 'Confirmed')) {
      throw new ApiError('Order cannot be cancelled', 400);
    }
    const cancelReason = req.user.role === 'Customer' ? 'User Cancelled' : 'Expired';

    await connection.query(
      `UPDATE orders SET status = ?, cancelReason = ? WHERE id = ?`,
      ['Cancelled', cancelReason, order.id]
    );

    await restock(order.id, connection);
    if (order.paymentStatus && order.paymentStatus !== 'Cancelled') {
      await connection.query(
        `UPDATE payments SET status = ? WHERE orderId = ?`,
        ['Cancelled', order.id]
      );
    }

    if (order.deliveryMode === 'Standard Delivery') {
      await connection.query(`UPDATE deliveries SET status= ? WHERE orderId=?`,['Cancelled',order.id])
    }
    

    await connection.commit();
    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
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
    console.log("Fetching total revenue...");

    // Use alias for cleaner result
    const rows = await query(orderQueries.getTotalRevenue);
    console.log("Rows:", rows);

    // Handle case when no orders exist (SUM returns null)
    const totalRevenue = rows[0]?.totalRevenue ?? 0;

    res.status(200).json({ success: true, data: totalRevenue });
  } catch (err) {
    next(err);
  }
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

const updateOrderStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    // Fetch order + delivery + payment info
    const [orderRows] = await connection.query(
      `SELECT o.*, p.status AS paymentStatus, d.id AS deliveryId, d.status AS deliveryStatus, d.staffId as deliveryStaffId
       FROM orders o
       LEFT JOIN payments p ON o.id = p.orderId
       LEFT JOIN deliveries d ON o.id = d.orderId
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!orderRows.length) throw new ApiError('Order not found', 404);
    const order = orderRows[0];
    const { status } = req.body;

    // Validate transition
    const isValid = await isValidUpdate(status, order.status);
    if (!isValid) throw new ApiError('Invalid status transition', 400);

    // --- Case: Shipped ---
    if (status === 'Shipped') {
      // Get order items with product + variant info
      const [items] = await connection.query(orderQueries.getOrderItemsByOrderId, [order.id]);

      for (const item of items) {
        if (item.isBackOrdered) {
          // Ensure enough stock exists
          const [variantRows] = await connection.query(
            `SELECT stockQnt FROM product_variants WHERE id = ? FOR UPDATE`,
            [item.variantId]
          );
          if (!variantRows.length || variantRows[0].stockQnt < item.quantity) {
            throw new ApiError(`Out of stock for item ${item.productName}`, 400);
          }

          // Deduct stock
          await updateStock(item.variantId, -item.quantity, connection);

          // Mark backordered item as processed
          await connection.query(
            `UPDATE order_items SET isBackOrdered = 0 WHERE id = ?`,
            [item.id]
          );
        }
      }
      // Update order + delivery statuses
      await connection.query(
        `UPDATE orders SET status = ? WHERE id = ?`,
        ['Shipped', order.id]
      );
      if (order.deliveryId) {
        await connection.query(
          `UPDATE deliveries SET status = ? WHERE id = ?`,
          ['Shipped', order.deliveryId]
        );
      }
      
    }
    if (status === 'Delivered' && order.paymentMethod === 'Card') {
      if (order.deliveryId && order.deliveryStaffId !== req.user.id) {
        throw new ApiError('Forbidden access', 403);
      }
      await connection.query(
        `UPDATE orders SET status = ? WHERE id = ?`,
        ['Delivered', order.id]
      );
      if (order.deliveryId) {
        await connection.query(
          `UPDATE deliveries SET status = ? ,deliveryDate = NOW() WHERE id = ?`,
          ['Delivered', order.deliveryId]
        );
      }
    }
    else {
      throw new ApiError("Invalid update", 400);
    }


    // Commit transaction
    await connection.commit();
    res.status(200).json({ success: true, message: 'Order status updated' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
const getTotalOrders = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getTotalOrders);
    const totalOrders = rows[0]?.totalOrders ?? 0;
    res.status(200).json({ success: true, data: totalOrders });
  } catch (err) {
    next(err);
  }
}



module.exports = {
  getOrders,
  getOrder,
  addOrder,
  getUserOrders,
  cancelOrder,
  getCategoryWiseOrders,
  getTotalRevenue,
  getOrderStatus,
  updateOrderStatus,
  getTotalOrders
};
