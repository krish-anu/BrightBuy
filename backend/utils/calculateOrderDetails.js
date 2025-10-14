// const { query } = require('../config/db');
// const ApiError = require('../utils/ApiError');
// const { estimateDeliveryDate } = require('../utils/estimateDeliveryDate');

// const calculateOrderDetails = async (items, deliveryMode, deliveryAddress, user,connection) => {
//     let totalPrice = 0;
//     let hasOutOfStock = false;
//     let orderedItems = [];

//     for (const item of items) {
//         // Get variant and product info from DB
//         const variants = await connection.query(
//             `SELECT pv.id AS variantId, pv.variantName, pv.price, pv.stockQnt, 
//                     p.id AS productId, p.name AS productName
//              FROM product_variants pv
//              JOIN products p ON pv.ProductId = p.id
//              WHERE pv.id = ?`,
//             [item.variantId]
//         );

//         const variant = variants[0];
//         if (!variant) throw new ApiError('Item not found', 404);
//         if (variant.stockQnt < item.quantity) hasOutOfStock = true;

//         // Round price properly
//         const price = parseFloat(Number(variant.price).toFixed(2));
//         const itemTotal = parseFloat((price * item.quantity).toFixed(2));

//         totalPrice += itemTotal;

//         orderedItems.push({
//             variantId: variant.variantId,
//             productId: variant.productId,
//             productName: variant.productName,
//             variantName: variant.variantName,
//             price, // already rounded
//             quantity: item.quantity,
//             total: itemTotal,
//             inStock: variant.stockQnt >= item.quantity
//         });
//     }

//     // Delivery settings
//     let deliveryCharge = deliveryMode === 'Standard Delivery' ? 150.0 : 0;
//     deliveryCharge = parseFloat(deliveryCharge.toFixed(2));

//     let deliveryDays = deliveryMode === 'Standard Delivery' ? 7 : 1;

//     let finalAddress = deliveryAddress;
//     if (deliveryMode === 'Standard Delivery') {
//         if (!finalAddress?.city) {
//             if (!user.address || !user.city) throw new ApiError('Delivery address is required', 400);
//             finalAddress = { ...user.address, city: user.city };
//         }

//         const cities = await connection.query(`SELECT * FROM cities WHERE name = ?`, [finalAddress.city]);
//         let city;
//         if (cities.length === 0) {
//             const result = await connection.query(
//                 `INSERT INTO cities (name, isMainCity) VALUES (?, ?)`,
//                 [finalAddress.city, 0]
//             );
//             city = { id: result.insertId, name: finalAddress.city, isMainCity: 0 };
//         } else {
//             city = cities[0];
//         }

//         if (city.isMainCity) deliveryDays = 5;
//     }

//     if (hasOutOfStock) deliveryDays += 3;

//     const deliveryDate = estimateDeliveryDate(deliveryDays);

//     // Final total rounded
//     const totalAmount = parseFloat((totalPrice + deliveryCharge).toFixed(2));

//     return {
//         totalPrice: parseFloat(totalPrice.toFixed(2)),
//         deliveryCharge,
//         totalAmount,
//         deliveryDate,
//         finalAddress,
//         orderedItems,
//         hasOutOfStock
//     };
// };

// module.exports = { calculateOrderDetails };
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { estimateDeliveryDate } = require('../utils/estimateDeliveryDate');

const calculateOrderDetails = async (items, deliveryMode, deliveryAddress, user, connection) => {
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

    // Delivery settings
    let deliveryCharge = deliveryMode === 'Standard Delivery' ? 150.0 : 0;
    deliveryCharge = parseFloat(deliveryCharge.toFixed(2));

    let deliveryDays = deliveryMode === 'Standard Delivery' ? 7 : 1;

    let finalAddress = deliveryAddress;
    if (deliveryMode === 'Standard Delivery') {
        if (!finalAddress?.city) {
            if (!user.address || !user.address.line1 || !user.address.city) throw new ApiError('Delivery address is required', 400);
            finalAddress = { ...user.address };
        }

        const cities = await connection.query(`SELECT * FROM cities WHERE name = ?`, [finalAddress.city]);
        let city;
        if (cities.length === 0) {
            const result = await connection.query(
                `INSERT INTO cities (name, isMainCity) VALUES (?, ?)`,
                [finalAddress.city, 0]
            );
            city = { id: result.insertId, name: finalAddress.city, isMainCity: 0 };
        } else {
            city = cities[0];
        }

        if (city.isMainCity) deliveryDays = 5;
    }

    if (hasOutOfStock) deliveryDays += 3;

    const deliveryDate = estimateDeliveryDate(deliveryDays);

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
        finalAddress,
        orderedItems,
        hasOutOfStock
    };
};

module.exports = { calculateOrderDetails };
