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
            type: DataTypes.ENUM('Pending', 'Confirmed', 'Failed'),
            allowNull: false,
            defaultValue: 'Pending',
        },
        transactionId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        }
    }, {
        indexes: [
            { fields: ['status'] },
            { fields: ['paymentMethod'] }]
    });
    return Payment;
};