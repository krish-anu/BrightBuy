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
    const deliveryRows = await query(deliveryQueries.getDeliveryById, [id]);
    console.log(deliveryRows)
    if (!deliveryRows.length) throw new ApiError('Delivery not found', 404);
    const userRows = await query(
      `SELECT * FROM users WHERE id = ?`,
      [staffId]
    );
    if (!userRows.length || userRows[0].role !== 'DeliveryStaff') {
      throw new ApiError('Invalid staff id', 400);
    }
    if (deliveryRows[0].staffId )
      throw new ApiError('Staff assigned',409)
    await query(deliveryQueries.updateDelivery, [staffId, new Date(), id]);
    const updatedDelivery = await query(
      deliveryQueries.getDeliveryById,
      [id]
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
