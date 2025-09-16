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
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      deliveryMode: {
        type: DataTypes.ENUM("Store Pickup", "Standard Delivery"),
        allowNull: false,
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
      cancelReason: {
        type: DataTypes.ENUM("User Cancelled", "Payment Failed","Expired"),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        }, 
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      addressId: {
        type: DataTypes.INTEGER,
        allowNull:true,
        references: {
          model: "Addresses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
