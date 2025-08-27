module.exports = (sequelize, DataTypes) => {
    const VariantAttribute = sequelize.define("VariantAttribute", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    });
    return VariantAttribute;
};
