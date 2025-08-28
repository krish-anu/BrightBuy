const ApiError = require('../utils/ApiError');

const db = require('../models');
const estimateDeliveryDate = require('../utils/estimateDeliveryDate');
const Order = db.order;
const OrderItem = db.orderItem;
const City = db.city;

const getOrders = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const options = {
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt',] } }],
            order: [['createdAt', 'DESC']],
            distinct: true,
        };
        if (limit) orders.limit = parseInt(limit);
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
        res.status(200).json({success:true,data:order})

    } catch (error) {
        next(error);
    }
};

const addOrder = async (req, res, next) => {
    try {
        const { items, deliveryMode,totalPrice } = req.body;
        if (!items || !deliveryMode || !totalPrice) throw new ApiError('Ordered items, total price and delivery mode is required', 400);
        const order = await db.sequelize.transaction(async t => {
            const deliveryDays = 1; 
            if (deliveryMode === 'Standard Delivery') {
                const deliveryAddress = req.body.deliveryAddress;
                // if not give fetch from user data
                const city = await City.findOrCreate({ where: { name: deliveryAddress.city } }, { transaction: t })
                deliveryDays = 7; 
                if (city.isMainCity) deliveryDays = 5;
            }
            // handle outof stock add 3 more days
            const deliveryDate = estimateDeliveryDate(deliveryDays);

            const newOrder = await Order.create({
                totalPrice,deliveryMode,estimateDeliveryDate:deliveryDate
            }, { transaction: t })

            for (const item of items) {
                await OrderItem.create({
                    variantId: item.variantId,
                    orderId:newOrder.id,
                    quantity: item.quantity,
                    price:item.price,
                }, { transaction: t })
            }

            const finalOrder = await Order.findByPk(newOrder.id, {
                attributes:{exclude:['createdAt','updatedAt']},
                include: [{ model: OrderItem ,attributes:{exclude:['createdAt','updatedAt','orderId']}}],
                transaction:t
            })
            return finalOrder;
        })
        res.status(200).json({success:true,data:order})
    } catch (error) {
        next(error);
    }
};

const getUserOrders = async (req, res, next) => {
    // get all orders of a user 
    // can use token to fetch userId
}

const getUserOrder = async (req, res, next) => {
}

const cancelOrder = async (req, res, next) => {
    try {
        const cancelledOrder=await db.sequelize.transaction(async t => {
            const order = await Order.findByPk(req.params.id, { transaction: t })
            if (!order) throw new ApiError('Order not found',404);
            if (['Confirmed','Shipped', 'Delivered'].includes(order.status))
                throw new ApiError('Order shipped or delivered cannot be cancelled', 400);
            // update stock if decemented - after confirmed cancellation allowed
            await order.update({ status: 'Cancelled' }, { transaction: t });
            return order;            
        })
        res.status(200).json({success:true,data:cancelledOrder})
    } catch (error) {
        next(error)
    }
}

const getOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            attributes:{include:['id','status','deliveryMode','deliveryAddress','estimatedDeliveryDate']}
        });
        if (!order) throw new ApiError('Order not found', 404);
        let result = { id: order.id, status: order.status };
        if (['Cancelled', 'Delivered'].includes(order.status)) {
            return res.status(200).json({success:true,data:result})
        }
        if (order.deliveryMode === 'Standard Delivery') {
            result.deliveryAddress = order.deliveryAddress;
            result.estimatedDeliveryDate = order.estimatedDeliveryDate;
        }
        res.status(200).json({sucess:true,data:result})
    } catch (error) {
        next(error)
    }
}

// update deliveryAddress or anything before shipping?

const updateOrderStatus = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

// const updateOrderItemQnt = async (req, res, next) => {
//     try {

//     } catch (error) {
//         next(error);
//     }
// };

// const deleteOrderItem = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
// };
// add,remove order item

// const updateOrder = async (req, res, next) => {
//     try {

//     } catch (error) {
//         next(error);
//     }
// };

// const deleteOrder = async (req, res, next) => {
//     try {

//     } catch (error) {
//         next(error);
//     }
// };

// get orders of a user
// order summary
// return handling

module.exports = {
    getOrders,
    getOrder,
    addOrder,
    cancelOrder,
    getOrderStatus,
    updateOrderStatus,
};