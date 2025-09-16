module.exports = (sequelize, DataTypes) => {
    const Delivery = sequelize.define(
        "Delivery",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            assignedDate: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
            deliveryDate: {
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
                    "Returned",
                    "Failed"
                ),
                allowNull: false,
                defaultValue: "Pending",
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            staffId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "Users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },
            orderId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Orders",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            
        },
        {
            // indexes: [
              
            // ],
        }
    );
    return Delivery;
};
