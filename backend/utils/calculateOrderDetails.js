

// module.exports = { calculateOrderDetails };
const { query } = require('../config/db');
const { EstimateDeliveryDate } = require('../services/delivery.service');
const ApiError = require('../utils/ApiError');


const calculateOrderDetails = async (items, deliveryMode, user, connection,deliveryAddressId) => {
    let totalPrice = 0;
    let hasOutOfStock = false;
    let orderedItems = [];

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError('No items provided', 400);
    }

    for (const item of items) {
        // Validate item structure
        if (!item.variantId || !item.quantity || item.quantity <= 0) {
            throw new ApiError('Invalid item data', 400);
        }

        // Get variant and product info from DB
        const [variants] = await connection.query(
            `SELECT pv.id AS variantId, pv.variantName, pv.price, pv.stockQnt, 
                    p.id AS productId, p.name AS productName
             FROM product_variants pv
             JOIN products p ON pv.ProductId = p.id
             WHERE pv.id = ?`,
            [item.variantId]
        );

        const variant = variants[0];
        if (!variant) throw new ApiError('Item not found', 404);

        if (variant.stockQnt < item.quantity) {
            item.isBackOrdered=true
            hasOutOfStock = true;
        }

        // Convert to number and validate
        const price = Number(variant.price);
        const quantity = Number(item.quantity);
 
        // Round price properly
        const roundedPrice = parseFloat(price.toFixed(2));
        const itemTotal = parseFloat((roundedPrice * quantity).toFixed(2));

        // Validate calculated values
        if (isNaN(roundedPrice) || isNaN(itemTotal)) {
            throw new ApiError(`Calculation error for variant ${ item.variantId }`, 500);
        }

        totalPrice += itemTotal;

        orderedItems.push({
            variantId: variant.variantId,
            productId: variant.productId,
            productName: variant.productName,
            variantName: variant.variantName,
            price: roundedPrice,
            quantity: quantity,
            total: itemTotal,
            isBackOrdered:item.isBackOrdered
        });
    }

    // Delivery charge calculation per business rules
    // Store Pickup is always free; Standard Delivery depends on destination city type and order value
    const round2 = (n) => parseFloat(Number(n).toFixed(2));
    const roundedSubtotal = round2(totalPrice);

    const calcShipping = (isMainCity, orderValue, mode) => {
        if (mode === 'Store Pickup') return 0;
        if (isMainCity) {
            if (orderValue <= 100) return 5.99;
            if (orderValue <= 500) return 3.99;
            return 0; // > 500 = free
        }
        // other/rural cities
        if (orderValue <= 100) return 9.99;
        if (orderValue <= 500) return 6.99;
        return 3.99; // > 500
    };

    let isMainCity = 0;
    if (deliveryMode === 'Standard Delivery') {
        // Resolve destination city type via deliveryAddressId -> addresses.cityId -> cities.isMainCity
        
        const [addrRows] = await connection.query(
            `SELECT a.cityId, c.isMainCategory
             FROM addresses a
             JOIN cities c ON c.id = a.cityId
             WHERE a.id = ?`,
            [deliveryAddressId]
        );
        if (!addrRows || !addrRows.length) {
            throw new ApiError('Invalid delivery address', 400);
        }
        isMainCity = Number(addrRows[0].isMainCategory) ? 1 : 0;
    }

    let deliveryCharge = round2(calcShipping(Boolean(isMainCity), roundedSubtotal, deliveryMode));


    // const deliveryDate = estimateDeliveryDate(deliveryDays);
    const deliveryDate = await EstimateDeliveryDate(deliveryAddressId,orderId=null, deliveryMode, hasOutOfStock, connection)

    // Final total rounded and validated
    const totalAmount = parseFloat((totalPrice + deliveryCharge).toFixed(2));

    // Final validation
    if (isNaN(totalAmount)) {
        throw new ApiError('Invalid total amount calculated', 500);
    }

    return {
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        deliveryCharge,
        totalAmount,
        deliveryDate,
        orderedItems,
        hasOutOfStock
    };
};

module.exports = { calculateOrderDetails };
