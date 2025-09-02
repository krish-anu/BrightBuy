module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        totalPrice: {
            // without delivery charge
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        deliveryMode: {
            type: DataTypes.ENUM('Store Pickup', 'Standard Delivery'),
            allowNull: false,
        },
        deliveryAddress: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        deliveryCharge: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        estimatedDeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deliveredDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'),
            allowNull: false,
            defaultValue: 'Pending',
        },
        cancelReason: {
            type:DataTypes.ENUM('PaymentFailed','Expired','UserCancelled')
        }
    }, {
        indexes: [
            { fields: ['orderDate'] },
            { fields: ['status'] }]
    });
    return Order;
};

// returned order?