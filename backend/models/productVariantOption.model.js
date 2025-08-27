module.exports = (sequelize, DataTypes) => {
    const ProductVariantOption = sequelize.define("ProductVariantOption", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    });
    return ProductVariantOption;
};
