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
    await query(deliveryQueries.updateDelivery, [staffId, new Date(), actualDeliveryId]);
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
  getDeliveries
};
