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
            validate: {
                notEmpty: true,
                len:[3,100]
            }
        },
    });
    return VariantAttribute;
};
