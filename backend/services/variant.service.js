const db = require('../models');
const ApiError = require('../utils/ApiError');

const { orderItem: OrderItem,
    productVariant: ProductVariant,
    order:Order,
 } = db;

const handlePreOrdered = async (variant, transaction) => {
    try {
        let currStock = variant.stockQnt;
        const updatedItems = []; 

        const items = await OrderItem.findAll({
            where: {
                variantId: variant.id,
                preOrdered: true
            },
            attributes: ['id', 'orderId', 'quantity'],
            transaction,
            order: [['createdAt', 'ASC']]
        });
        if (!items || items.length === 0) {
            throw new ApiError('No preordered items found', 404);
        }
        for (const item of items) {
            const required = item.quantity;
            if (currStock < required) {
                break; 
            }
            currStock -= required;
            item.preOrdered = false;
            updatedItems.push(item);
            await item.save({ transaction });
        }
        if (updatedItems.length > 0) {
            const change=variant.stock-currStock
            await updateStock(variant.id,change,transaction)
        }

        return {
            processedItems: updatedItems.length,
            remainingStock: currStock,
            updatedItems
        };

    } catch (error) {
        throw error;
    }
};

const updateStock = async (variantId, quantityChange, transaction) => {
    const variant = await ProductVariant.findByPk(variantId, { transaction, lock: true });
    if (!variant) throw new ApiError('Variant not found', 404);

    const newStock = variant.stockQnt + quantityChange;
    if (newStock < 0) throw new ApiError('Stock cannot go below 0', 400);

    await variant.update({ stockQnt: newStock }, { transaction });
    return variant;
};

const restock = async (orderId, transaction) => {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) throw new ApiError('Order not found', 404);
    if (order.status !== 'Cancelled') return;

    const orderedItems = await OrderItem.findAll({
        where: { orderId },
        attributes: ['id', 'quantity', 'preOrdered', 'variantId'],
        transaction,
    });

    for (const item of orderedItems) {
        if (!item.preOrdered) {
            await updateStock(item.variantId, item.quantity, transaction);
        }
    }
};

module.exports = {
    handlePreOrdered,
    updateStock,
    restock
}