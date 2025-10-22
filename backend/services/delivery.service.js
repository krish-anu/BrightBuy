const { estimateDeliveryDate } = require("../utils/estimateDeliveryDate");

const EstimateDeliveryDate = async (orderId = null, deliveryAddressId = null, deliveryMode, hasOutOfStock, connection) => {
    try {
        if (!connection) {
            throw new Error("Database connection is required");
        }

        // Base delivery days
        let deliveryDays = deliveryMode === 'Standard Delivery' ? 7 : 1;

        // Check if main city
        const [rows] = await connection.query(
            `SELECT isMainCategory FROM cities WHERE id = ?`,
            [deliveryAddressId]
        );

        if (rows.length > 0 && rows[0].isMainCategory) {
            deliveryDays = 5;
        }
        

        

        // Add extra delay for out of stock
        if (hasOutOfStock) {
            deliveryDays += 3;
        }

        // Calculate estimated delivery date
        const deliveryDate = estimateDeliveryDate(deliveryDays);
        return deliveryDate;

    } catch (error) {
        console.error("Error calculating estimated delivery date:", error);
        throw error;
    }
};

module.exports = { EstimateDeliveryDate};
