const ApiError = require('../utils/ApiError');

const isValidDeliveryUpdate = (newStatus, delivery) => {
    const validStatus = {
        Pending: 0,
        Confirmed: 1,
        Shipped: 2,
        Delivered: 3,
        Returned: 4,
        Failed: 5,
    };
    const currStatus = delivery.status;

    if (!(newStatus in validStatus))
        throw new ApiError('Invalid status', 400);
    if (validStatus[newStatus] <= validStatus[currStatus])
        throw new ApiError('Invalid update', 400);

    return true;
};

const CODPayment = async (amount,order, payment, delivery, transaction) => {
    if (parseFloat(payment.amount) !== parseFloat(amount)) {
        console.log(amount, payment.amount);
        throw new ApiError('Invalid payment amount', 400);
    }
    await payment.update({ status: 'Paid' }, { transaction });
    await order.update({ status: 'Delivered' }, { transaction });
    await delivery.update(
        { status: 'Delivered', deliveryDate: new Date() },
        { transaction }
    );
    return delivery;
};

module.exports = {
    isValidDeliveryUpdate,
    CODPayment,
};
