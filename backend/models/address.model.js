module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define(
        "Address",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            addressLine1: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            addressLine2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            postalCode: {
                type: DataTypes.STRING(20),
                allowNull:false,
                validate: {
                    notEmpty: true,
                    len:[3,20]
                },
            }, 
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            cityId: {
                type: DataTypes.UUID, 
                allowNull: true,
                references: {
                    model: "Cities",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },
        },
        {
            // indexes: [
            // ],
        }
    );
    return Address;
};
