module.exports = (sequelize, DataTypes) => {
    const ProductVariant = sequelize.define("ProductVariant", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        variantName: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        SKU: {
            type: DataTypes.STRING,
            unique: true,
            allowNull:false,
        },
        stockQnt: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
        },
    });
    return ProductVariant;
};
