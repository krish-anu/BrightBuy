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
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
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
    },
    { paranoid: true }
  );
  return Order;
};
