module.exports = (sequelize, DataTypes) => {
  const VariantAttribute = sequelize.define("VariantAttribute", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
            validate: {
                notEmpty: true,
                len:[3,100]
            }
    },
  });
  return VariantAttribute;
};
