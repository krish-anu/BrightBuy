module.exports = (sequelize, DataTypes) => {
    const ProductVariantOption = sequelize.define("ProductVariantOption", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            }
        },
        variantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "ProductVariants",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        attributeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "VariantAttributes",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

    });
    return ProductVariantOption;
};
