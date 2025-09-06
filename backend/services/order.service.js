const db = require('../models');
const ApiError = require('../utils/ApiError');
const { createPayment } = require('./payment.service');

const Order = db.order;
const OrderItem = db.orderItem;
const ProductVariant = db.productVariant;
const ProductVariantOption = db.productVariantOption;
const VariantAttribute = db.variantAttribute;


const saveOrderToDatabase = async (items, userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, transaction, paymentMethod, paymentIntentId = null) => {
    const order = await createOrder(userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge,paymentMethod, transaction);
    await addOrderItems(order.id, items, transaction);
    await createPayment(order.id, totalPrice, deliveryCharge, paymentMethod, paymentIntentId, transaction);
    return getOrderDetails(order.id, transaction);
};

const createOrder = async (userId, deliveryMode, deliveryAddress, estimatedDeliveryDate, totalPrice, deliveryCharge, paymentMethod,transaction) => {
    const status = paymentMethod === 'COD' ? 'Confirmed' : 'Pending';
    const order = await Order.create({
        totalPrice, // without delivery
        deliveryMode,
        estimatedDeliveryDate,
        deliveryAddress,
        deliveryCharge,
        userId,
        status,
    }, { transaction });
    return order;
};

const addOrderItems = async (orderId, items, transaction) => {
    for (const item of items) {
        const variant = await ProductVariant.findByPk(item.variantId, { transaction });
        if (!variant) throw new ApiError('Variant not found', 404);

        const isBackOrdered = variant.stockQnt < item.quantity;
        await OrderItem.create({
            variantId: item.variantId,
            orderId,
            quantity: item.quantity,
            unitPrice: variant.price,
            totalPrice: variant.price * item.quantity,
            isBackOrdered
        }, { transaction });
        if (!isBackOrdered) {
            await updateStock(item.variantId,-item.quantity,transaction);
        }
       
    }
};

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

const updateStock = async (variantId, quantityChange, transaction) => {
    const variant = await ProductVariant.findByPk(variantId, {
        transaction,
        lock: true
    });
    if (!variant) throw new ApiError('Variant not found', 404);
    const newStock = variant.stockQnt + quantityChange;
    if (newStock < 0) throw new ApiError('Stock cannot go below 0', 400);
    await variant.update({ stockQnt: newStock }, { transaction });
    return variant;
};

//increment stock after order cancelled
const restock = async (orderId, transaction) => {
    try {
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) throw new ApiError('Order not found', 404);

        // Allow restocking for cancelled orders
        if (order.status !== 'Cancelled') {
            console.log(`Order ${ orderId } is not cancelled, skipping restock`);
            return;
        }

        const orderedItems = await OrderItem.findAll({
            where: { orderId },
            attributes: ['id', 'quantity', 'isBackOrdered', 'variantId'],
            transaction,
        });

        for (const item of orderedItems) {
            // Only restock items that were actually deducted from stock
            if (!item.isBackOrdered) {
                await updateStock(item.variantId, item.quantity, transaction);
            }
        }

        console.log(`Successfully restocked items for order ${ orderId }`);
    } catch (error) {
        console.error('Error in restock:', error);
        throw error; // Re-throw to be handled by the calling function
    }
};


module.exports = {
    saveOrderToDatabase, addOrderItems,
    getOrderDetails,
    createOrder,
    restock,
    updateStock
    
};