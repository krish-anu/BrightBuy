const db = require('../models');
const ApiError = require('../utils/ApiError');
const { calculateOrderDetails, isValidOrderCancel, updateStatus,createOrderInDB } = require('../services/order.service');
const { createPayment } = require('../services/payment.service');
const ROLES = require('../roles');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { order: Order,
  orderItem: OrderItem,
  city: City,
  product: Product,
  productVariant: ProductVariant,
  category: Category,
  user: User,
  payment: Payment,
  address: Address,
  delivery: Delivery, } = db;


/* get all orders*/
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

/* get an order by id*/
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: OrderItem, attributes: { exclude: ['createdAt', 'updatedAt'] } }]
    });
    if (!order) throw new ApiError('Order not found', 404);
    if (req.user.role === ROLES.USER && order.userId !== req.user.id) {
      throw new ApiError('Forbidden access', 403);
    }
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
        include: [
          {
            model: Address,
            include: [{model: City,attributes: ['name', 'isMainCity']}]
          }
        ],
        transaction: t
      });
      
      let finalAddress = null;
      if (deliveryMode === 'Standard Delivery') {
        if (typeof deliveryAddress === 'number' || typeof deliveryAddress === 'string' && !isNaN(deliveryAddress)) {
          const existingAddress = user.Addresses.find(addr => addr.id === parseInt(deliveryAddress));
          if (!existingAddress)
            throw new ApiError('Address not found', 404);
          finalAddress = existingAddress;
        } else if (typeof deliveryAddress === 'object') {
          const { addressLine1, addressLine2, postalCode, cityId } = deliveryAddress;
          if (!addressLine1 || !postalCode || !cityId)
            throw new ApiError('Invalid address format',400)
          const city = await City.findByPk(cityId, { transaction: t });
          if (!city) throw new ApiError('City not found', 404);

          const newAddress = await Address.create({
            userId: req.user.id,
            addressLine1,
            addressLine2,
            cityId,
            postalCode
          }, { transaction: t, });
          finalAddress = await Address.findByPk(newAddress.id, {
            include: [{ model: City, attributes: ['name', 'isMainCity'] }],
            transaction: t
          });
        } else {
          throw new ApiError('Invalid Address', 400);
        }
      }

      const { totalPrice, deliveryCharge, deliveryDate,orderedItems } =
        await calculateOrderDetails(items, deliveryMode, deliveryAddress, t);
      const status = paymentMethod === 'COD' ? 'Confirmed' : 'Pending';
      const order = await createOrderInDB(
        orderedItems,
        req.user.id,
        deliveryMode,
        finalAddress,
        deliveryDate,
        totalPrice,
        deliveryCharge,
        status,
        t
      );

      const totalAmount=totalPrice+deliveryCharge

      await createPayment(order.id, totalAmount,  paymentMethod, req.user.id, t);
      // create delivery if standard delivery mode
      if (deliveryMode === 'Standard Delivery') {    
        await Delivery.create({
          orderId: order.id,
          status: 'Pending'
        }, { transaction:t });
      }

      if (paymentMethod === 'COD') {
        return { type: 'order', order };
      }

      if (paymentMethod === 'Card') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: orderedItems.map(item => ({
            price_data: {
              currency: 'lkr',
              product_data: { name: item.variantName },
              unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
          })),
          mode: 'payment',
          success_url: `http://localhost:8081/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:8081/api/payment/cancel`,
          metadata: {
            userId: req.user.id,
            orderId: order.id
          }
        });
        return { type: 'checkout', sessionId: session.id };
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

/*get all orders of a user*/
const getUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === ROLES.USER && parseInt(id) !== req.user.id) {
      throw new ApiError('Forbidden access',403)
    }
    const options = {
      where: { userId:id},
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

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    const cancelledOrder = await db.sequelize.transaction(async t => {
      let order = await Order.findByPk(req.params.id, {
        include:{model:Payment},
        transaction: t
      });
      if (!order) throw new ApiError('Order not found', 404);
      if (req.user.role === ROLES.USER && order.userId !== req.user.id) {
        throw new ApiError('Forbidden access', 403);
      }
      const payment = order.Payment;
      order = await isValidOrderCancel('Cancelled', order, payment, cancelReason, t);
      if (order) {
        order=await updateStatus(order, payment, cancelReason,t);
      }

      if (order.deliveryMode === 'Standard Delivery') {
        const delivery = await Delivery.findOne({ where: { orderId: order.id }, transaction: t });
        await delivery.update({ status: 'Returned' }, { transaction :t})
      }
      return order;
    });
    res.status(200).json({ success: true, data: cancelledOrder });
  } catch (error) { next(error); }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === ROLES.USER && parseInt(id) !== req.user.id) {
      throw new ApiError('Forbidden access', 403);
    }
    const order = await Order.findByPk(id, {
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
    const totalRevenue = await Order.sum('totalPrice');
    res.status(200).json({ success: true, data: totalRevenue });
  } catch (error) { next(error); }
};



module.exports = {
  getOrders,
  getOrder,
  addOrder,
  getUserOrders,
  cancelOrder,
  getOrderStatus,
  getCategoryWiseOrders,
  getTotalRevenue,

};
