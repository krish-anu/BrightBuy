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
    
    // Transform the data to include customer object and fetch order items
    const ordersWithCustomersAndItems = await Promise.all(rows.map(async (row) => {
      const { customerId, customerName, customerEmail, customerPhone, ...orderData } = row;
      
      // Fetch order items for each order
      const orderItems = await query(orderQueries.getOrderItemsByOrderId, [orderData.id]);
      
      return {
        ...orderData,
        customer: customerId ? {
          id: customerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        } : null,
        items: orderItems
      };
    }));
    
    res.status(200).json({ success: true, data: ordersWithCustomersAndItems });
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
    
    // Transform the order data to include customer object
    const { customerId, customerName, customerEmail, customerPhone, ...orderData } = orders[0];
    const orderWithCustomer = {
      ...orderData,
      customer: customerId ? {
        id: customerId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      } : null,
      items: orderItems
    };
    
    res.status(200).json({ success: true, data: orderWithCustomer });
  } catch (err) { next(err); }
};

// Add order
const addOrder = async (req, res, next) => {
  const connection = await pool.getConnection();

  await connection.beginTransaction();
  console.log(query);

  try {
    const { items, paymentMethod, deliveryMode, deliveryAddressId } = req.body;

    // Validation
    if (!items || !deliveryMode || !paymentMethod) {
      throw new ApiError('Items, delivery mode, and payment method are required', 400);
    }

    // Validate delivery address for Standard Delivery
    if (deliveryMode === 'Standard Delivery' && !deliveryAddressId) {
      throw new ApiError('Delivery address is required for Standard Delivery', 400);
    }

    if (deliveryMode === 'Store Pickup' && paymentMethod === 'CashOnDelivery') {
      throw new ApiError('Invalid payment method', 400);
    }

    const { totalPrice, deliveryCharge, deliveryDate, orderedItems } =
      await calculateOrderDetails(items, deliveryMode, req.user, connection);

    const order = await saveOrderToDatabase(
      orderedItems,
      req.user.id,
      deliveryMode,
      deliveryAddressId,
      deliveryDate,
      totalPrice,
      deliveryCharge,
      paymentMethod,
      connection
    );

    await createPayment(req.user.id, order.id, totalPrice, deliveryCharge, paymentMethod, connection);

    // Delivery row is auto-created by sp_create_order for Standard Delivery

    if (paymentMethod === 'CashOnDelivery') {
      await connection.commit();
      return res.status(201).json({ success: true, data: order });
    }

    if (paymentMethod === 'Card') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: orderedItems.map(item => ({
          price_data: {
            currency: 'usd',
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
    console.log("Fetching category wise orders...");
    const rows = await query(orderQueries.getCategoryWiseOrders);
    console.log("Category wise orders raw result:", rows);

    // Return the raw data directly - the frontend expects an array of category objects
    res.status(200).json({ success: true, data: rows });
  } catch (err) { 
    console.error("Error in getCategoryWiseOrders:", err);
    next(err); 
  }
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
      // Compute estimated delivery date: prefer orderDate else createdAt, add 3 days
      const base = order.orderDate || order.createdAt;
      try {
        const d = new Date(base);
        d.setDate(d.getDate() + 3);
        result.estimatedDeliveryDate = d.toISOString();
      } catch (e) {
        result.estimatedDeliveryDate = null;
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// Get orders assigned to the authenticated delivery/warehouse staff
const getAssignedOrders = async (req, res, next) => {
  try {
    const role = (req.user.role || '').toString().toLowerCase();
    let rows = [];

    // If WarehouseStaff should see the same orders as Admin, fetch all orders for them
    if (role === 'warehousestaff' || role === 'warehouse') {
      rows = await query(orderQueries.getAllOrders);
    } else {
      const staffId = req.user.id;
      rows = await query(orderQueries.getOrdersAssignedToStaff, [staffId]);
    }

    // Transform the data to include order items for each order
    const ordersWithItems = await Promise.all(rows.map(async (row) => {
      const orderItems = await query(orderQueries.getOrderItemsByOrderId, [row.id]);
      const { customerId, customerName, customerEmail, customerPhone, ...orderData } = row;
      return {
        ...orderData,
        customer: customerId ? { id: customerId, name: customerName, email: customerEmail, phone: customerPhone } : null,
        items: orderItems
      };
    }));
    res.status(200).json({ success: true, data: ordersWithItems });
  } catch (err) {
    next(err);
  }
};

// Admin/SuperAdmin: Get orders with status 'Shipped' so admin can assign delivery staff
const getShippedOrders = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getShippedOrders);

    const ordersWithItems = await Promise.all(rows.map(async (row) => {
      const orderItems = await query(orderQueries.getOrderItemsByOrderId, [row.id]);
      const { customerId, customerName, customerEmail, customerPhone, ...orderData } = row;
      return {
        ...orderData,
        customer: customerId ? { id: customerId, name: customerName, email: customerEmail, phone: customerPhone } : null,
        items: orderItems
      };
    }));

    res.status(200).json({ success: true, data: ordersWithItems });
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
  const userRole = req.user.role ? req.user.role.toLowerCase() : '';
  let { status } = req.body;
  if (!status) throw new ApiError('Status is required', 400);
  // Normalize status to Title Case (e.g., 'shipped' -> 'Shipped') to avoid casing issues
  status = String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();

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
    // --- Case: Delivered ---
    else if (status === 'Delivered') {
      // Only allow delivery staff to mark delivered when there's a delivery record
      // Admins and SuperAdmins can also update delivery status
      if (order.deliveryId && userRole !== 'admin' && userRole !== 'superadmin' && order.deliveryStaffId !== req.user.id) {
        console.warn(`updateOrderStatus forbidden: requester=${req.user.id} role=${req.user.role} deliveryStaffId=${order.deliveryStaffId} orderId=${order.id}`);
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
    // --- Case: Simple status updates (Confirmed, Pending) ---
    else if (['Confirmed', 'Pending'].includes(status)) {
      await connection.query(
        `UPDATE orders SET status = ? WHERE id = ?`,
        [status, order.id]
      );
    }
    else {
      // For any other status not explicitly handled above (e.g., Cancelled),
      // prevent non-assigned delivery staff from updating delivery-specific orders.
      // Admins and SuperAdmins may bypass this restriction.
      if (order.deliveryId && userRole !== 'admin' && userRole !== 'superadmin' && order.deliveryStaffId !== req.user.id) {
        console.warn(`updateOrderStatus forbidden: requester=${req.user.id} role=${req.user.role} deliveryStaffId=${order.deliveryStaffId} orderId=${order.id}`);
        throw new ApiError('Forbidden access', 403);
      }
      throw new ApiError("Invalid update", 400);
    }


  // Commit transaction
  await connection.commit();

  // Fetch and return updated order details so frontend can update state
  // Select order with joined user fields to construct customer object (same shape as getOrder/getOrders)
  const [updatedRows] = await connection.query(
    `SELECT o.*, u.id as customerId, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
     FROM orders o
     LEFT JOIN users u ON o.userId = u.id
     WHERE o.id = ?`,
    [order.id]
  );
  const updatedOrderRow = updatedRows[0];
  const [orderItems] = await connection.query(orderQueries.getOrderItemsByOrderId, [order.id]);

  // Build response object matching getOrder/getOrders shape
  const { customerId, customerName, customerEmail, customerPhone, ...orderData } = updatedOrderRow;
  const updatedOrder = {
    ...orderData,
    customer: customerId ? { id: customerId, name: customerName, email: customerEmail, phone: customerPhone } : null,
    items: orderItems
  };

  res.status(200).json({ success: true, data: updatedOrder });
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
const getStats = async (req, res, next) => {  
  try {
    const [totalOrders] = await query(orderQueries.getTotalOrders);
    const [totalRevenue] = await query(orderQueries.getTotalRevenue);
    const [categoryWiseOrders] = await query(orderQueries.getCategoryWiseOrders);
    const orderStatusCounts = await query(orderQueries.getOrderStatusCounts);

    // Process order status counts to ensure all statuses are included
    const statusOverview = {
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };

    // Fill in the actual counts from database
    orderStatusCounts.forEach(row => {
      if (statusOverview.hasOwnProperty(row.status)) {
        statusOverview[row.status] = row.count;
      }
    });

    const stats = {
      totalOrders: totalOrders?.totalOrders ?? 0,
      totalRevenue: totalRevenue?.totalRevenue ?? 0,
      categoryWiseOrders: categoryWiseOrders ?? [],
      orderStatusOverview: statusOverview
    };
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

// Quarterly sales for a given year
const getQuarterlySales = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    console.log(`Fetching quarterly sales for year=${year}`);
    const rows = await query(orderQueries.quarterlySalesByYear, [year]);
    console.log('Quarterly sales raw rows:', rows);

    // If DB returned no rows, return a consistent four-quarter object with zeros
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn(`No quarterly sales rows found for year=${year}, returning zeroed quarters`);
      const defaultQuarters = [
        { quarter: 'Q1', totalOrders: 0, totalSales: 0 },
        { quarter: 'Q2', totalOrders: 0, totalSales: 0 },
        { quarter: 'Q3', totalOrders: 0, totalSales: 0 },
        { quarter: 'Q4', totalOrders: 0, totalSales: 0 }
      ];
      return res.status(200).json({ success: true, data: { year, quarters: defaultQuarters } });
    }

    // Normalize numeric fields
    const quarters = rows.map(r => ({
      quarter: String(r.quarter),
      totalOrders: Number(r.totalOrders) || 0,
      totalSales: Number(r.totalSales) || 0
    }));

    res.status(200).json({ success: true, data: { year, quarters } });
  } catch (err) { next(err); }
}

// Top selling products in a period
const getTopSellingProducts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const s = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const e = endDate || new Date().toISOString().split('T')[0];
    let l = Number(limit) || 10;
    if (l < 5) l = 5; // enforce minimum requested limit

    console.log('Top products query params:', { startDate: s, endDate: e, limit: l });

    // Always use the no-limit query (avoids LIMIT parameter issues on some MySQL setups)
    const allRows = await query(orderQueries.topSellingProductsBetweenNoLimit, [s, e]);
    let products = (allRows || []).slice(0, l);

    // If still fewer than 5 overall (very small catalog), attempt to pad with products
    // that have zero sales by fetching products and excluding those already present.
    if (products.length < 5) {
      const needed = 5 - products.length;
      console.log(`Padding results with ${needed} additional products with zero sales`);
      const allProducts = await query(`SELECT id AS productId, name AS productName FROM products ORDER BY name ASC`);
      const existingIds = new Set(products.map(p => p.productId));
      for (const p of allProducts) {
        if (products.length >= 5) break;
        if (!existingIds.has(p.productId)) {
          products.push({ productId: p.productId, productName: p.productName, totalSold: 0 });
        }
      }
    }

    // Cap to requested limit
    products = products.slice(0, l);

    res.status(200).json({ success: true, data: { startDate: s, endDate: e, limit: l, products } });
  } catch (err) { next(err); }
}

// Customer-wise order summary and payment status
const getCustomerOrderSummary = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.customerOrderSummary);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// Upcoming orders with delivery time estimates
const getUpcomingDeliveryEstimates = async (req, res, next) => {
  try {
    const rows = await query(orderQueries.getUpcomingOrdersWithEstimates);
    res.status(200).json({ success: true, data: rows });
  } catch (err) { next(err); }
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
  getAssignedOrders,
  getShippedOrders,
  getTotalOrders,
  getStats,
  // New report endpoints
  getQuarterlySales,
  getTopSellingProducts,
  getCustomerOrderSummary,
  getUpcomingDeliveryEstimates
};
