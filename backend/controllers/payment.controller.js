const db = require('../models');
const Order = db.order;
const ApiError = require('../utils/ApiError');
const Payment = db.payment;


app.get("/success", async (req, res) => {
    try {
        const result = await db.sequelize.transaction(async t => {
            const session = await stripeWebhook.checkout.sessions.retrieve(req.query.session_id);
            if (session.status != 'paid') {
                throw new ApiError('Payment not completed', 400);
            }
            const { orderId, userId } = session.metadata;
            const order = await Order.findByPk(orderId, { transaction: t });

            await order.update({ status: 'Confirmed' }, { transaction: t });
            const payment = await Payment.findOne({ where: { orderId: orderId } }, { transaction: t });
            await payment.update({ status: 'Paid' }, { transaction: t });
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
                transaction: t
            });
        });
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);

    }
});

app.get("/cancel", async (req, res) => {
    try {
        await db.sequelize.transaction(async t => {
            const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
            const { orderId, userId } = session.metadata;
            const order = await Order.findByPk(orderId);
            await Order.destroy({ where: { id: order.id } });
            const payment = await Payment.findOne({ where: { orderId: order.id } }, { transaction: t });
            await payment.update({ status: 'Failed' }, { transaction: t });
            await payment.destroy();
            res.status(200).json({ success: true, message: 'payment Cancelled' });
    
        });
    } catch (error) {
        next(error);
    }

});

