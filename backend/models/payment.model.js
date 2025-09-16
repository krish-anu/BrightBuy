module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        paymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        paymentMethod: {
            type: DataTypes.ENUM('COD', 'Card'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Paid', 'Failed',
            'Cancelled'
            ),
            allowNull: false,
            defaultValue: 'Pending',
        },
        paymentIntentId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
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
    });
    return Payment;
};