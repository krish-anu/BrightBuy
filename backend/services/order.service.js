const db = require('../models');
const ApiError = require('../utils/ApiError');

const { restock,updateStock, }=require('../services/variant.service')

const Order = db.order;
const OrderItem = db.orderItem;
const ProductVariant = db.productVariant;
const ProductVariantOption = db.productVariantOption;
const VariantAttribute = db.variantAttribute;

const estimateDeliveryDate = (daysToAdd) => {
    const now = new Date();
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate;
};

const calculateOrderDetails = async (items, deliveryMode, deliveryAddress, transaction) => {
    let totalPrice = 0;
    let hasOutOfStock = false;
    const orderedItems = [];

    for (const item of items) {
        if (!item.variantId || !item.quantity || item.preOrdered)
            throw new ApiError('Invalid item format',400)
        const variant = await ProductVariant.findByPk(item.variantId, { transaction });

        if (!variant) {
            console.log(item)
            throw new ApiError('Item not found', 404);
            
        } 

        let preOrdered = item.preOrdered;
        const inStock = variant.stockQnt >= item.quantity;
        if (!inStock) preOrdered = true;
        if (preOrdered) hasOutOfStock = true;

        const itemTotal = variant.price * item.quantity;
        totalPrice += itemTotal;

        orderedItems.push({
            variantId: variant.id,
            variantName: variant.variantName,
            price: variant.price,
            quantity: item.quantity,
            totalPrice: itemTotal,
            preOrdered
        });
    }

    let deliveryCharge = deliveryMode === 'Standard Delivery' ? 150.0 : 0;
    let deliveryDays = deliveryMode === 'Standard Delivery' ? 7 : 1;

    if (deliveryMode === 'Standard Delivery' && deliveryAddress.City?.isMainCity) {
        deliveryDays = 5;
    }
    if (hasOutOfStock) deliveryDays += 3;

    const deliveryDate = estimateDeliveryDate(deliveryDays);

    return { totalPrice, deliveryCharge, deliveryDate, orderedItems };
};

async function createOrderInDB(
    orderedItems,
    userId,
    deliveryMode,
    deliveryAddress,
    estimatedDeliveryDate,
    totalPrice,
    deliveryCharge,
    status,
    transaction,
) {
    const totalAmount = totalPrice + deliveryCharge;
    const orderData = {
        userId,
        deliveryMode,
        totalAmount,
        deliveryCharge,
        estimatedDeliveryDate,
        status,
    };
    if (deliveryMode === 'Standard Delivery') orderData.addressId = deliveryAddress.id;

    const order = await Order.create(orderData, { transaction });

    for (const item of orderedItems) {
        const variant = await ProductVariant.findByPk(item.variantId, { transaction });
        if (!variant) throw new ApiError('Variant not found', 404);

        await OrderItem.create({
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.totalPrice,
            preOrdered: item.preOrdered
        }, { transaction });

        if (!item.preOrdered)
            await updateStock(item.variantId, -item.quantity, transaction);
    }
    return order;
}

const getOrderDetails = async (orderId, transaction) => {
    return await Order.findByPk(orderId, {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{
            model: OrderItem,
            attributes: { exclude: ['createdAt', 'updatedAt', 'orderId', 'variantId'] },
            include: [{
                model: ProductVariant,
                attributes: ['id', 'variantName', 'SKU', 'price'],
                include: [{
                    model: VariantAttribute,
                    attributes: ['id', 'name'],
                    through: { model: ProductVariantOption, attributes: ['value'] }
                }]
            }]
        }],
        transaction
    });
};

const isValidOrderUpdate = async (newStatus, order) => {
    const validStatus = { Pending: 0, Confirmed: 1, Shipped: 2, Delivered: 3, Cancelled: 4 };
    const currStatus = order.status;

    if (!(newStatus in validStatus)) throw new ApiError('Invalid status', 400);
    if (validStatus[newStatus] <= validStatus[currStatus]) throw new ApiError('Invalid update', 400);
    return true;
};

const updateStatus = async (order, payment, cancelReason, transaction) => {
    await order.update({ status: 'Cancelled', cancelReason }, { transaction });
    await restock(order.id, transaction);
    await payment.update({ status: 'Cancelled' }, { transaction });
    return order;
};

const isValidOrderCancel = async (newStatus, order, payment, cancelReason) => {
    await isValidOrderUpdate(newStatus, order);
    if (payment.status === 'Paid') throw new ApiError('Cannot cancel', 400);

    const validCancelReasons = ['User Cancelled', 'Payment Failed', 'Expired'];
    if (!cancelReason || !validCancelReasons.includes(cancelReason))
        throw new ApiError('Valid cancel reason required', 400);

    return order;
};

module.exports = {
    getOrderDetails,
    createOrderInDB,
    calculateOrderDetails,
    isValidOrderCancel,
    isValidOrderUpdate,
    updateStatus,
};
