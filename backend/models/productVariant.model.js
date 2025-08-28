module.exports = (sequelize, DataTypes) => {
    const ProductVariant = sequelize.define("ProductVariant", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        variantName: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 200]
            }
        },
        SKU: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 100]
            }
        },
        stockQnt: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: { min: 0 }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
        },
    }, {
        indexes: [
            { fields: ['SKU'], unique: true },
            { fields: ['stockQnt'] },
            { fields: ['price'] }]
    });
    return ProductVariant;
};
