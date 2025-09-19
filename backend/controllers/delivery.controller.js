const ApiError = require('../utils/ApiError');
const {query} = require('../config/db');
const deliveryQueries = require('../queries/deliveryQueries');
const { isValidDeliveryUpdate, CODPayment } = require('../services/delivery.service');
const { updateStock } = require('../services/variant.service');

const getDeliveries = async (req, res, next) => {
  try {
    const alldeliveries = await query('SELECT * FROM deliveries')
    console.log(alldeliveries)
    res.status(200).json({success:true,data:alldeliveries})
  } catch (error) {
    next(error)
  }
}

const assignDeliveryStaff = async (deliveryId, staffId, connection) => {
  const [deliveryRows] = await query(deliveryQueries.getDeliveryById, [deliveryId], connection);
  if (!deliveryRows.length) throw new ApiError('Delivery not found', 404);

  // Assuming staff validation is done separately
  await query(deliveryQueries.updateDelivery, [staffId, 'Confirmed', null, deliveryId], connection);
  return { id: deliveryId, staffId, status: 'Confirmed' };
};

const updateDeliveryStatus = async (deliveryId, newStatus, connection) => {
  const [deliveryRows] = await query(deliveryQueries.getDeliveryById, [deliveryId], connection);
  if (!deliveryRows.length) throw new ApiError('Delivery not found', 404);
  const delivery = deliveryRows[0];

  isValidDeliveryUpdate(newStatus, delivery);

  const [orderRows] = await query(deliveryQueries.getOrderById, [delivery.orderId], connection);
  const order = orderRows[0];

  if (newStatus === 'Shipped') {
    const items = await query(deliveryQueries.getOrderItemsWithVariant, [order.id], connection);

    for (const item of items) {
      if (item.stockQnt < item.quantity)
        throw new ApiError('Out of stock items are present', 400);

      await updateStock(item.variantId, -item.quantity, connection);
      await query(deliveryQueries.markItemsProcessed([item.id]), [item.id], connection);
    }

    await query(deliveryQueries.updateDelivery, [delivery.staffId, newStatus, null, deliveryId], connection);
    await query(deliveryQueries.updateOrderStatus, [newStatus, order.id], connection);

  } else if (newStatus === 'Delivered') {
    const [paymentRows] = await query(deliveryQueries.getPaymentByOrderId, [order.id], connection);
    const payment = paymentRows[0];
    if (payment?.status !== 'Paid') throw new ApiError('Cannot deliver unpaid order', 400);

    await query(deliveryQueries.updateDelivery, [delivery.staffId, newStatus, new Date(), deliveryId], connection);
    await query(deliveryQueries.updateOrderStatus, [newStatus, order.id], connection);

  } else {
    throw new ApiError('Invalid status update', 400);
  }

  return delivery;
};

const addCODPayment = async (deliveryId, amount, userId, connection) => {
  const [deliveryRows] = await query(deliveryQueries.getDeliveryById, [deliveryId], connection);
  if (!deliveryRows.length) throw new ApiError('Delivery not found', 404);
  const delivery = deliveryRows[0];

  if (delivery.staffId !== userId) throw new ApiError('Forbidden access', 403);

  const [orderRows] = await query(deliveryQueries.getOrderById, [delivery.orderId], connection);
  const order = orderRows[0];

  const [paymentRows] = await query(deliveryQueries.getPaymentByOrderId, [order.id], connection);
  const payment = paymentRows[0];

  return CODPayment(amount, order, payment, delivery, connection);
};

module.exports = {
  assignDeliveryStaff,
  updateDeliveryStatus,
  addCODPayment,
  getDeliveries
};
