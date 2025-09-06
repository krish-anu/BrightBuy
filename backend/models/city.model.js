module.exports = (sequelize, DataTypes) => {
    const City = sequelize.define("City", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 200]
            } 
        },
        isMainCity: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });
    return City;
};
