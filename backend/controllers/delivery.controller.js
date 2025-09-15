const ApiError = require('../utils/ApiError');
const db = require('../models');
const { isValidDeliveryUpdate, CODPayment } = require('../services/delivery.service');
const { updateStock } = require('../services/variant.service');

const { order: Order,
    user: User,
    payment: Payment,
    delivery: Delivery,
    orderItem: OrderItem,
    productVariant: ProductVariant } = db;

const assignDeliveryStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;
        
        const updatedDelivery = await db.sequelize.transaction(async (transaction) => {
            const delivery = await Delivery.findByPk(id, { transaction });
            if (!delivery) throw new ApiError('Delivery not found', 404);

            const deliveryStaff = await User.findByPk(staffId, { transaction });
            if (!deliveryStaff || deliveryStaff.role !== 'deliveryStaff')
                throw new ApiError('Staff not found', 404);

            await delivery.update(
                { staffId, status: 'Confirmed', assignedDate: new Date() },
                { transaction }
            );
            return delivery;
        });

        res.status(200).json({ success: true, data: updatedDelivery });
    } catch (error) {
        next(error);
    }
};

const updateDeliveryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newStatus } = req.body;

        const updatedDelivery = await db.sequelize.transaction(async (transaction) => {
            const delivery = await Delivery.findByPk(id, {
                include: [{ model: Order, include: [Payment] }],
                transaction,
                lock: true,
            });
            if (!delivery) throw new ApiError('Delivery not found', 404);

            isValidDeliveryUpdate(newStatus, delivery);

            if (newStatus === 'Shipped') {
                const orderItems = await OrderItem.findAll({
                    where: { orderId: delivery.Order.id, preOrdered: true },
                    include: [
                        { model: ProductVariant, attributes: ['id', 'stockQnt'] }
                    ],
                    transaction
                });
                for (const item of orderItems) {

                    if (item.ProductVariant.stockQnt < item.quantity)
                        throw new ApiError('Out of stock items are present', 400);
                    await updateStock(item.variantId, -item.quantity, transaction);
                    await item.update({ preOrdered: false }, { transaction });


                }
                await delivery.update({ status: newStatus }, { transaction });
                await delivery.Order.update({ status: newStatus }, { transaction });
            } else if (newStatus === 'Delivered' && delivery.Order.Payment.status === 'Paid') {
                await delivery.update(
                    { status: newStatus, deliveryDate: new Date() },
                    { transaction }
                );
                await delivery.Order.update({ status: newStatus }, { transaction });
            } else {
                throw new ApiError('Invalid status update', 400);
            }

            return delivery;
        });

        res.status(200).json({ success: true, data: updatedDelivery });
    } catch (error) {
        next(error);
    }
};

const addCODPayment = async (req, res, next) => {
    try {
        const { id } = req.params; // delivery id
        const { amount } = req.body;

        const updatedDelivery = await db.sequelize.transaction(async (transaction) => {
            const delivery = await Delivery.findByPk(id, {
                include: { model: Order },
                transaction,
                lock: true,
            });
            if (!delivery) throw new ApiError('Delivery not found', 404);

            if (delivery.staffId !== req.user.id)
                throw new ApiError('Forbidden access', 403);
            const payment=await Payment.findOne({where:{orderId:delivery.orderId}},{transaction})
            return await CODPayment(amount,delivery.Order, payment, delivery, transaction);
        });

        res.status(200).json({ success: true, data: updatedDelivery });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateDeliveryStatus,
    addCODPayment,
    assignDeliveryStaff,
};
