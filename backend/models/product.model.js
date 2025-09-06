module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
     name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len:[2,200]
            }
        },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand: {
            type: DataTypes.STRING(100),
            allowNull:true,
        }
  },{
        indexes:[{fields:['brand']}]
    });
  return Product;
};
