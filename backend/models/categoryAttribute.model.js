module.exports = (sequelize, DataTypes) => {
    const CategoryAttribute = sequelize.define(
        "CategoryAttribute",
        {
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Categories", 
                    key: "id",
                },
                primaryKey: true,
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
                primaryKey: true,
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "CategoryAttributes", // make sure table name is consistent

        }
    );

    return CategoryAttribute ;
};
