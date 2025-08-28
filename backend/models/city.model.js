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
            unique: true,
            validate: {
                notEmpty: true,
                len: [2, 200]
            }
        },
        isMainCity: {
            type: DataTypes.BOOLEAN,
            defaultValue:false
        }
    }, {
        indexes: [{ fields: ['name'] },{fields:['isMainCity']}]
    });
    return City;
};