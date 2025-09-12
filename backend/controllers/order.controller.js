const ApiError = require('../utils/ApiError');
const { fn, col } = require('sequelize');
const { calculateOrderDetails } = require('../utils/calculateOrderDetails');
const db = require('../models');
const { STRIPE_SECRET_KEY } = require('../config/dbConfig');
const stripe = require('stripe')(STRIPE_SECRET_KEY);

const Order = db.order;
const OrderItem = db.orderItem;
const City = db.city;
const ProductVariant = db.productVariant;
const Product = db.product;
const Category = db.category;
const User = db.user;

// Helper function to save order and order items in DB
// Helper function to save order and order items in DB
async function createOrderInDB(
  orderedItems,
  userId,
  deliveryMode,
  deliveryAddress,
  estimatedDeliveryDate,
  totalPrice,
  deliveryCharge,
  transaction,
  paymentMethod
) {
  // Create the main order
  const order = await Order.create({
    UserId: userId,
    deliveryMode,
    deliveryAddress,
    estimatedDeliveryDate,
    totalPrice,
    deliveryCharge,
    paymentMethod
  }, { transaction });

  // Create each order item
  for (const item of orderedItems) {
    await OrderItem.create({
      OrderId: order.id,
      ProductVariantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.price,                // price per single item
      totalPrice: item.price * item.quantity // total price for this line item
    }, { transaction });
  }

  return order;
}


const getOrders = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const options = {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }],
      order: [['createdAt', 'DESC']],
      distinct: true
    };
    if (limit) options.limit = parseInt(limit);
    const orders = await Order.findAll(options);
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }]
    });
    if (!order) throw new ApiError('Order not found', 404);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
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

      const { totalPrice, deliveryCharge, deliveryDate, finalAddress, orderedItems } =
        await calculateOrderDetails(items, deliveryMode, deliveryAddress, user, t);

      const order = await createOrderInDB(
        orderedItems,
        req.user.id,
        deliveryMode,
        finalAddress,
        deliveryDate,
        totalPrice,
        deliveryCharge,
        t,
        paymentMethod
      );

      if (paymentMethod === 'COD') {
        return { type: 'order', order };
      }

      if (paymentMethod === 'Card') {
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
          success_url: `http://localhost:8081/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:8081/payment/cancel`,
          metadata: {
            userId: req.user.id,
            orderId: order.id
          }
        });
        return { type: 'checkout', checkoutUrl: session.url };
      }

      throw new ApiError('Invalid payment method', 400);
    });

    if (result.type === 'order')
      return res.status(201).json({ success: true, data: result.order });

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
      distinct: true
    };
    if (req.query.limit) options.limit = parseInt(req.query.limit);
    const orders = await Order.findAll(options);
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

const getUserOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, UserId: req.user.id },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }]
    });
    if (!order) throw new ApiError('Order not found', 404);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const cancelledOrder = await db.sequelize.transaction(async t => {
      const order = await Order.findByPk(req.params.id, { transaction: t });
      if (!order) throw new ApiError('Order not found', 404);
      if (order.UserId !== req.user.id)
        throw new ApiError('Forbidden: You cannot cancel this order', 403);
      if (['Confirmed', 'Shipped', 'Delivered'].includes(order.status))
        throw new ApiError('Order shipped or delivered cannot be cancelled', 400);

      await order.update({ status: 'Cancelled' }, { transaction: t });
      return order;
    });
    res.status(200).json({ success: true, data: cancelledOrder });
  } catch (error) { next(error); }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: ['id', 'status', 'deliveryMode', 'deliveryAddress', 'estimatedDeliveryDate', 'UserId']
    });
    if (!order) throw new ApiError('Order not found', 404);

    let result = { id: order.id, status: order.status };
    if (['Cancelled', 'Delivered'].includes(order.status)) return res.status(200).json({ success: true, data: result });

    if (order.deliveryMode === 'Standard Delivery') {
      result.deliveryAddress = order.deliveryAddress;
      result.estimatedDeliveryDate = order.estimatedDeliveryDate;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getCategoryWiseOrders = async (req, res, next) => {
  try {
    const result = await OrderItem.findAll({
      include: [
        {
          model: ProductVariant,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Category,
                  through: { attributes: [] },
                  include: [{ model: Category, as: 'parent' }]
                }
              ]
            }
          ]
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
      ]
    });

    const categoryOrders = {};
    let totalOrders = 0;
    for (const row of result) {
      const parent = row.parentId;
      const child = row.categoryId;
      const count = parseInt(row.orderCount);
      if (parent !== null) {
        if (!categoryOrders[parent]) categoryOrders[parent] = { category: row.parentName, totalOrders: 0, subcategories: {} };
        categoryOrders[parent].totalOrders += count;
        categoryOrders[parent].subcategories[child] = { categoryName: row.categoryName, order: count };
      }
      totalOrders += count;
    }

    res.status(200).json({ success: true, data: { categoryOrders, totalOrders } });
  } catch (error) { next(error); }
};

const getTotalRevenue = async (req, res, next) => {
  try {
    console.log('Calculating total revenue...');
    
    const totalRevenue = await Order.sum('totalPrice');
    console.log('Total revenue calculated:', totalRevenue); 
    res.status(200).json({ success: true, data: totalRevenue });
  } catch (error) { next(error); }
};

 
module.exports = {
  getOrders,
  getOrder,
  addOrder,
  getUserOrder,
  getUserOrders,
  cancelOrder,
  getOrderStatus,
  getCategoryWiseOrders,
  getTotalRevenue
};
