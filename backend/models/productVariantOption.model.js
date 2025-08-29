module.exports = (sequelize, DataTypes) => {
    const ProductVariantOption = sequelize.define("ProductVariantOption", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        value: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len:[1,200]
            }
        },

    });
    return ProductVariantOption;
};
