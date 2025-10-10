const ApiError = require('../utils/ApiError');
const {query} = require('../config/db');
const deliveryQueries = require('../queries/deliveryQueries');

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
    const staffId = req.user.id;
    // Return delivery with order total, delivery address and customer phone so frontend can render without extra calls
    const rows = await query(
      `SELECT d.*, o.id AS orderId, o.totalPrice AS orderTotal, o.deliveryAddress AS deliveryAddress, o.estimatedDeliveryDate AS estimatedDelivery, o.status AS orderStatus, u.phone AS customerPhone
       FROM deliveries d
       JOIN orders o ON d.orderId = o.id
       LEFT JOIN users u ON o.userId = u.id
       WHERE d.staffId = ?
       ORDER BY d.createdAt DESC`,
      [staffId]
    );
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
  try {
    const { id } = req.params;
    const { staffId } = req.body;
    let deliveryRows = await query(deliveryQueries.getDeliveryById, [id]);
    console.log('Existing delivery rows for id', id, deliveryRows);
    // If no delivery found, assume caller passed an orderId and create a delivery row for that order
    if (!deliveryRows.length) {
      console.log(`No delivery found with id=${id}, attempting to create delivery for order id ${id}`);
      // Create a delivery row for the order and then refetch
      const insertResult = await query(
        `INSERT INTO deliveries (orderId, status, createdAt) VALUES (?, 'Pending', ?)`,
        [id, new Date()]
      );
      const newDeliveryId = insertResult.insertId;
      deliveryRows = await query(deliveryQueries.getDeliveryById, [newDeliveryId]);
    }
    const userRows = await query(
      `SELECT * FROM users WHERE id = ?`,
      [staffId]
    );
    if (!userRows.length || userRows[0].role !== 'DeliveryStaff') {
      throw new ApiError('Invalid staff id', 400);
    }
    if (deliveryRows[0].staffId )
      throw new ApiError('Staff assigned',409)
      // Use the actual delivery id to update (could be newly created)
      const actualDeliveryId = deliveryRows[0].id;
      // Mark delivery as assigned and set deliveryDate to now
      // Use 'Assigned' which is included in the deliveries.status enum
      await query(deliveryQueries.updateDelivery, [staffId, 'Assigned', new Date(), actualDeliveryId]);

      // Also update the related order status to 'Assigned' so orders reflect that they are assigned to delivery
      try {
        const orderId = deliveryRows[0].orderId;
        if (orderId) await query(deliveryQueries.updateOrderStatus, ['Assigned', orderId]);
      } catch (orderErr) {
        console.error('Failed to update order status when assigning delivery staff', orderErr);
      }

      const updatedDelivery = await query(
        deliveryQueries.getDeliveryById,
        [actualDeliveryId]
      );
      res.status(200).json({ success: true, data: updatedDelivery[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  assignDeliveryStaff,
  getDeliveries, 
  getAssignedDeliveriesForStaff,
  updateDeliveryStatusController
};
