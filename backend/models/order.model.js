module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      deliveryMode: {
        type: DataTypes.ENUM("Store Pickup", "Standard Delivery"),
        allowNull: false,
      },
      deliveryAddress: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      deliveryCharge: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        validate: { min: 0 },
      },
      estimatedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM(
          "Pending",
          "Confirmed",
          "Shipped",
          "Delivered",
          "Cancelled"
        ),
        allowNull: false,
        defaultValue: "Pending",
      },
      paymentMethod: {
        type: DataTypes.ENUM("Card", "CashOnDelivery"),
        allowNull: false,
      },
      cancelReason: {
        type: DataTypes.ENUM("PaymentFailed", "Expired", "UserCancelled"),
        allowNull: true,
      },
    },
    {
      indexes: [
        { fields: ["orderDate"] },
        { fields: ["status"] },
      ],
    }
  );
  return Order;
};
