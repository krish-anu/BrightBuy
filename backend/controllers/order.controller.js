const ApiError = require('../utils/ApiError');
const { fn, col } = require('sequelize');
const { calculateOrderDetails } = require('../utils/calculateOrderDetails');
const { saveOrderToDatabase } = require('../services/order.service');

const db = require('../models');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const Order = db.order;
const OrderItem = db.orderItem;
const City = db.city;
const ProductVariant = db.productVariant;
const Product = db.product;
const Category = db.category;
const User = db.user;

const stripe = require('stripe')(STRIPE_SECRET_KEY);



const getOrders = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const options = {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }],
            order: [['createdAt', 'DESC']],
            distinct: true,
        };
        if (limit) options.limit = parseInt(limit);
        const orders = await Order.findAll(options);
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};


const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt',] } }],
        });
        if (!order) throw new ApiError('Order not found', 404);
        res.status(200).json({ success: true, data: order });

    } catch (error) {
        next(error);
    }
};

const addOrder = async (req, res, next) => {
    try {
        const { items, paymentMethod, deliveryMode, deliveryAddress } = req.body;
        if (!items || !deliveryMode || !paymentMethod) {
            throw new ApiError('Items, delivery mode, and payment method are required', 400);
        }

        const result = await db.sequelize.transaction(async t => {
            const user = await User.findByPk(req.user.id, {
                attributes: ['address', 'cityId'],
                include: [{ model: City, attributes: ['name', 'isMainCity'] }],
                transaction: t
            });

            const { totalPrice, deliveryCharge, totalAmount, deliveryDate, finalAddress, orderedItems } =
                await calculateOrderDetails(items, deliveryMode, deliveryAddress, user, t);

            if (paymentMethod === 'COD') {
                const order = await saveOrderToDatabase(
                    orderedItems,
                    req.user.id,
                    deliveryMode,
                    finalAddress,
                    deliveryDate,
                    totalPrice,
                    deliveryCharge,
                    t,
                    'COD'
                );
                return { type: 'order', order };
            }
            if (paymentMethod === 'Card') {
                const pendingOrder = await saveOrderToDatabase(
                    orderedItems,
                    req.user.id,
                    deliveryMode,
                    finalAddress,
                    deliveryDate,
                    totalPrice,
                    deliveryCharge,
                    t,
                    'Card' 
                );
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: orderedItems.map(item => ({
                        price_data: {
                            currency: 'lkr',
                            product_data: { name: item.productName },
                            unit_amount: Math.round(item.price * 100)
                        },
                        quantity: item.quantity
                    })),
                    mode: 'payment',
                    success_url: `http://localhost:8081/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `http://localhost:8081/cancel`,
                    metadata: {
                        userId: req.user.id,
                        orderId:pendingOrder.id,
                    }
                });
                return { type:'checkout',checkoutSessionId: session.id };
            }
            throw new ApiError('Invalid payment method',400)
        });
        if (result.type === 'order')
            return res.status(201).json({success:true,data:result.order})
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getUserOrders = async (req, res, next) => {
    try {
        const options = {
            where: { UserId: req.user.id },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }],
            order: [['createdAt', 'DESC']],
            distinct: true,
        };
        if (req.query.limit) options.limit = parseInt(req.query.limit);
        const orders = await Order.findAll(options);
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

const getUserOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, UserId: req.user.id },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }],
        });
        if (!order) throw new ApiError('Order not found', 404);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const cancelledOrder = await db.sequelize.transaction(async t => {
            const order = await Order.findByPk(req.params.id, { transaction: t });
            if (!order) throw new ApiError('Order not found', 404);
            if (order.userId !== req.user.id) {
                console.log(order.UserId, req.user.id);
                throw new ApiError('Forbidden: You cannot cancel this order', 403);
            }
            if (['Confirmed', 'Shipped', 'Delivered'].includes(order.status))
                throw new ApiError('Order shipped or delivered cannot be cancelled', 400);
            // update stock if decemented - after confirmed cancellation allowed
            await order.update({ status: 'Cancelled' }, { transaction: t });
            return order;
        });
        res.status(200).json({ success: true, data: cancelledOrder });
    } catch (error) {
        next(error);
    }
};

const getOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            attributes: { include: ['id', 'status', 'deliveryMode', 'deliveryAddress', 'estimatedDeliveryDate','userId'] }
        });
        if (!order) throw new ApiError('Order not found', 404);
        let result = { id: order.id, status: order.status };
        if (['Cancelled', 'Delivered'].includes(order.status)) {
            return res.status(200).json({ success: true, data: result });
        }
        if (order.deliveryMode === 'Standard Delivery') {
            result.deliveryAddress = order.deliveryAddress;
            result.estimatedDeliveryDate = order.estimatedDeliveryDate;
        }
        res.status(200).json({ sucess: true, data: result });
    } catch (error) {
        next(error);
    }
};

// update deliveryAddress or anything before shipping?

const updateOrderStatus = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

const getCategoryWiseOrders = async (req, res, next) => {
    try {
        const result = await OrderItem.findAll({
            attributes: [],
            include: [
                {
                    model: ProductVariant, attributes: [],
                    include: [{
                        model: Product, attributes: [],
                        include: [{
                            model: Category, attributes: ['id', 'name', 'parentId'], through: { attributes: [] },
                            include: [{ model: Category, as: 'parent', attributes: ['id', 'name'] }]
                        }]
                    }]
                }
            ],
            group: ['ProductVariant.Product.Categories.id'],
            raw: true,
            attributes: [
                [fn('COUNT', col('OrderItem.id')), 'orderCount'],
                [col('ProductVariant.Product.Categories.id'), 'categoryId'],
                [col('ProductVariant.Product.Categories.name'), 'categoryName'],
                [col('ProductVariant.Product.Categories.parentId'), 'parentId'],
                [col('ProductVariant.Product.Categories.parent.name'), 'parentName']
            ],
        });
        const categoryOrders = {};
        let totalOrders = 0;
        for (const row of result) {
            const parent = row.parentId;
            const child = row.categoryId;
            const count = parseInt(row.orderCount);
            const parentName = row.parentName;
            const categoryName = row.categoryName;

            if (parent !== null) {
                if (!categoryOrders[parent])
                    categoryOrders[parent] = { catgory: parentName, totalOrders: 0, subcategories: {} };
                categoryOrders[parent].totalOrders += count;
                categoryOrders[parent].subcategories[child] = { categoryName: categoryName, order: count };
            }
            totalOrders += count;
        }


        res.status(200).json({ success: true, data: { categoryOrders, totalOrders } });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    getOrders,
    getOrder,
    addOrder,
    getUserOrder,
    getUserOrders,
    cancelOrder,
    getOrderStatus,
    updateOrderStatus,
    getCategoryWiseOrders
};