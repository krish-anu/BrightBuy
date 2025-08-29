const ApiError = require('../utils/ApiError');

const db = require('../models');
const estimateDeliveryDate = require('../utils/estimateDeliveryDate');
const City = db.city;
const ProductVariant = db.productVariant;
const Product = db.product;

const calculateOrderDetails = async (items, deliveryMode,  deliveryAddress, user, transaction) => {
    let totalPrice = 0;
    let hasOutOfStock = false;
    let orderedItems = [];

    for (const item of items) {
        const variant = await ProductVariant.findByPk(item.variantId, { include: [{ model: Product, attributes: ['id', 'name'] }], transaction });
        if (!variant) throw new ApiError('Item not found', 404);
        if (variant.stockQnt < item.quantity) hasOutOfStock = true; // allow preorder
        const itemTotal = variant.price * item.quantity;
        totalPrice += itemTotal;
        orderedItems.push({
            variantId: variant.id,
            productId: variant.Product.id,
            productName: variant.Product.name,
            variantName: variant.variantName,
            price: variant.price,
            quantity: item.quantity,
            total: itemTotal,
            inStock: variant.stockQnt >= item.quantity
        });
    }
    let deliveryCharge = deliveryMode === 'Standard Delivery' ? 150.00 : 0;
    let deliveryDays = deliveryMode === 'Standard Delivery' ? 7 : 1;

    let finalAddress = deliveryAddress;
    if (deliveryMode === 'Standard Delivery') {
        if (!finalAddress?.city) {
            if (!user.address || !user.City) throw new ApiError('Delivery address is required', 400);
            finalAddress = { ...user.address, city: user.City.name };
        }
        const [city] = await City.findOrCreate({
            where: { name: finalAddress.city },
            defaults: { isMainCity: false },
            transaction
        });
        if (city.isMainCity) deliveryDays = 5;
    }

    if (hasOutOfStock) deliveryDays += 3;

    const deliveryDate = estimateDeliveryDate(deliveryDays);
    const totalAmount = totalPrice + deliveryCharge;

    return { totalPrice, deliveryCharge, totalAmount, deliveryDate, finalAddress, orderedItems, hasOutOfStock };
};

module.exports={calculateOrderDetails}