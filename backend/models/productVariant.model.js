module.exports = (sequelize, DataTypes) => {
    const ProductVariant = sequelize.define("ProductVariant", {
       id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
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
    });
    return ProductVariant;
};
