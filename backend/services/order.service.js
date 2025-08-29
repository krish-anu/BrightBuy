const db = require('../models');
const ApiError = require('../utils/ApiError');

const Order = db.order;
const OrderItem = db.orderItem;
const ProductVariant = db.productVariant;
const ProductVariantOption = db.productVariantOption;
const VariantAttribute = db.variantAttribute;
const Payment = db.payment;

const saveOrderToDatabase = async (items, userId, deliveryMode, finalAddress, deliveryDate, totalPrice, deliveryCharge, transaction, paymentMethod = 'COD', paymentIntentId = null) => {
    const order = await Order.create({
        totalPrice, // without delivery
        deliveryMode,
        estimatedDeliveryDate: deliveryDate,
        deliveryAddress: finalAddress,
        deliveryCharge,
        userId,
        status: paymentMethod === 'COD' ? 'Confirmed' : 'Pending'
    }, { transaction });

    for (const item of items) {
        const variant = await ProductVariant.findByPk(item.variantId, { transaction });
        if(!variant) throw new ApiError('Variant not found',404)
        const isBackOrdered = variant.stockQnt < item.quantity;
        await OrderItem.create({
            variantId: item.variantId,
            orderId: order.id,
            quantity: item.quantity,
            unitPrice: variant.price,
            totalPrice: variant.price * item.quantity,
            isBackOrdered
        }, { transaction });
        if (!isBackOrdered) {
            await ProductVariant.decrement('stockQnt', {
                by: item.quantity,
                where: { id: item.variantId },
                transaction
            });
        }
    }
    if (paymentMethod) {
        await Payment.create({
            orderId: order.id,
            amount: parseFloat(totalPrice) + parseFloat(deliveryCharge),
            paymentMethod: paymentMethod,
            status: paymentIntentId ? 'Paid' : 'Pending',
            paymentIntentId
        }, { transaction });
    }

    return await Order.findByPk(order.id, {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{
            model: OrderItem,
            attributes: { exclude: ['createdAt', 'updatedAt', 'orderId', 'variantId'] },
            include: [{
                model: ProductVariant,
                attributes: ['id', 'variantName', 'SKU', 'price', 'stockQnt'],
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

module.exports={saveOrderToDatabase}