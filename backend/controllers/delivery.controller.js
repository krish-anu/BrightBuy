const ApiError = require('../utils/ApiError');
const {query, pool} = require('../config/db');
const deliveryQueries = require('../queries/deliveryQueries');
const orderQueries = require('../queries/orderQueries');
const { EstimateDeliveryDate } = require('../services/delivery.service');


const getDeliveries = async (req, res, next) => {
  try {
    const alldeliveries = await query('SELECT * FROM deliveries')
    console.log(alldeliveries)
    res.status(200).json({success:true,data:alldeliveries})
  } catch (error) {
    next(error)
  }
}

// Get deliveries assigned to the currently authenticated delivery staff
const getAssignedDeliveriesForStaff = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    // Normalize address using addresses table (orders now store deliveryAddressId)
    // Build a human readable address string; fallback to 'Store Pickup' if no address
    const baseSelect = `
      SELECT 
        d.*, 
        o.id AS orderId, 
        o.totalPrice AS orderTotal, 
  COALESCE(NULLIF(CONCAT_WS(', ', a.line1, a.line2, a.postalCode), ''), 'Store Pickup') AS deliveryAddress,
        DATE_ADD(COALESCE(o.orderDate, o.createdAt), INTERVAL 3 DAY) AS estimatedDelivery, 
        o.status AS orderStatus, 
        cust.phone AS customerPhone,
        staff.name AS staffName
      FROM deliveries d
      JOIN orders o ON d.orderId = o.id
      LEFT JOIN addresses a ON o.deliveryAddressId = a.id
      LEFT JOIN users cust ON o.userId = cust.id
      LEFT JOIN users staff ON d.staffId = staff.id
    `;

    let sql = baseSelect;
    const params = [];
    const where = [];
    if (role === 'DeliveryStaff') {
      where.push('d.staffId = ?');
      params.push(userId);
    }
    // Only show assigned deliveries for this endpoint
    where.push("d.status = 'Assigned'");
    if (where.length) {
      sql += `WHERE ${where.join(' AND ')}\n`;
    }
    sql += `ORDER BY d.createdAt DESC`;

    const rows = await query(sql, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// Allow delivery staff (or admin) to update delivery status
const updateDeliveryStatusController = async (req, res, next) => {
  try {
    const { id } = req.params; // delivery id
    const { status } = req.body; // expected values: 'in_transit', 'delivered', 'failed'

    // validate status
    const allowed = ['in_transit', 'delivered', 'failed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const rows = await query(deliveryQueries.getDeliveryById, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Delivery not found' });

    const delivery = rows[0];

    // Only assigned delivery staff or admins may update
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin' && delivery.staffId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Map to actual DB status values if needed
    // Here we assume deliveries.status enum contains matching values like 'Pending','Shipped','Delivered'
    let dbStatus = delivery.status;
    if (status === 'in_transit') dbStatus = 'Shipped';
    if (status === 'delivered') dbStatus = 'Delivered';
    if (status === 'failed') dbStatus = 'Cancelled';

    await query(deliveryQueries.updateDeliveryStatus, [dbStatus, new Date(), id]);

    // If the delivery was marked as Delivered (or Shipped), also update the corresponding order
    try {
      if (dbStatus === 'Delivered' || dbStatus === 'Shipped') {
        // delivery variable includes orderId from earlier fetch
        await query(deliveryQueries.updateOrderStatus, [dbStatus, delivery.orderId]);
      }
    } catch (orderErr) {
      // Log but don't fail the entire request if order update fails
      console.error('Failed to update order status after delivery update', orderErr);
    }

    const updated = await query(deliveryQueries.getDeliveryById, [id]);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    next(error);
  }
}

const assignDeliveryStaff = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let [deliveryRows] = await connection.query(deliveryQueries.getDeliveryById, [id]);
    // If no delivery found, assume caller passed an orderId and create a delivery row for that order
    if (!deliveryRows.length) {
      const insertResult = await connection.query(
        `INSERT INTO deliveries (orderId, status, createdAt) VALUES (?, 'Pending', ?)`,
        [id, new Date()]
      );
      const newDeliveryId = insertResult[0].insertId;
      [deliveryRows] = await connection.query(deliveryQueries.getDeliveryById, [newDeliveryId]);
    }

    // validate staff exists and is DeliveryStaff
    const [userRows] = await connection.query(`SELECT * FROM users WHERE id = ?`, [staffId]);
    if (!userRows.length || userRows[0].role !== 'DeliveryStaff') {
      throw new ApiError('Invalid staff id', 400);
    }

    if (deliveryRows[0].staffId) {
      throw new ApiError('Staff assigned', 409);
    }

    const actualDeliveryId = deliveryRows[0].id;

    // Mark delivery as assigned and set deliveryDate to now
    await connection.query(deliveryQueries.updateDelivery, [staffId, 'Assigned', new Date(), actualDeliveryId]);

    // Also update the related order status to 'Assigned' so orders reflect that they are assigned to delivery
    const orderId = deliveryRows[0].orderId;
    if (orderId) {
      // This may fail if DB enum doesn't include 'Assigned' — let it bubble so transaction rolls back
      await connection.query(deliveryQueries.updateOrderStatus, ['Assigned', orderId]);
    }

    await connection.commit();

    const [updatedDeliveryRows] = await connection.query(deliveryQueries.getDeliveryById, [actualDeliveryId]);
    res.status(200).json({ success: true, data: updatedDeliveryRows[0] });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) { console.error('rollback failed', e); }
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// SuperAdmin delivery staff assignment summary
const getDeliveryStaffAssignmentSummary = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const rows = await query(orderQueries.getDeliveryStaffAssignmentSummary);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getEstimatedDeliveryDate = async (req, res, next) => {
  try {
    const { deliveryAddressId, deliveryMode, hasOutOfStock } = req.body;

    if (deliveryAddressId == null || !deliveryMode || hasOutOfStock == null) {
      throw new ApiError('deliveryAddressId, deliveryMode, hasOutOfStock are required', 400);
    }

    const connection = await pool.getConnection();

    const deliveryDate = await EstimateDeliveryDate(
      deliveryAddressId,
      deliveryMode,
      hasOutOfStock,
      connection
    );

    connection.release();

    return res.status(200).json({
      success: true,
      data: deliveryDate,
    });
  } catch (error) {
    console.error("Error in getEstimatedDeliveryDate:", error);
    next(error);
  }
};




module.exports = {
  assignDeliveryStaff,
  getDeliveries, 
  getAssignedDeliveriesForStaff,
  updateDeliveryStatusController,
  getDeliveryStaffAssignmentSummary,
  getEstimatedDeliveryDate
};
