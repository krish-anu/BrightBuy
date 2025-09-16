
const estimateDeliveryDate = (daysToAdd) => {
    const now = new Date();
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate;
};

module.exports = { estimateDeliveryDate };