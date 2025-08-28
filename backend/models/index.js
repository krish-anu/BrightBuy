const dbConfig = require("../config/dbConfig");

const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

sequelize.authenticate().then(() => {
  console.log('Connected...');
}).catch(err => {
  console.log('Error ' + err);

});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user=require('./user.model')(sequelize,DataTypes)
db.product = require('./product.model')(sequelize, DataTypes);
db.category = require('./category.model')(sequelize, DataTypes);
db.productCategory = require('./productCategory.model')(sequelize, DataTypes);
db.variantAttribute = require('./variantAttribute.model')(sequelize, DataTypes);
db.productVariant = require('./productVariant.model')(sequelize, DataTypes);
db.productVariantOption = require('./productVariantOption.model')(sequelize, DataTypes);
db.order = require('./order.model')(sequelize, DataTypes);
db.orderItem = require('./orderItem.model')(sequelize, DataTypes);
db.payment = require('./payment.model')(sequelize, DataTypes);
db.city=require('./city.model')(sequelize,DataTypes)

db.sequelize.sync({ force :false}).then(() => {
  console.log('Yes re-sync done');

});

// Associations
db.user.hasMany(db.order)
db.order.belongsTo(db.user)

db.category.hasMany(db.category, { as: 'subcategories', foreignKey: 'parentId',onDelete:'SET NULL' });
db.category.belongsTo(db.category, { as: 'parent', foreignKey: 'parentId',onDelete:'SET NULL' });

db.product.belongsToMany(db.category, { through: db.productCategory });
db.category.belongsToMany(db.product, { through: db.productCategory });
db.productCategory.belongsTo(db.category);
db.productCategory.belongsTo(db.product);

db.productVariant.belongsToMany(db.variantAttribute, { through: db.productVariantOption, foreignKey: 'variantId' });
db.variantAttribute.belongsToMany(db.productVariant, { through: db.productVariantOption, foreignKey: 'attributeId' });
db.productVariantOption.belongsTo(db.productVariant, { foreignKey: 'variantId' });
db.productVariantOption.belongsTo(db.variantAttribute, { foreignKey: 'attributeId' });


db.product.hasMany(db.productVariant, { onDelete: 'CASCADE', hooks: true });
db.productVariant.belongsTo(db.product);

db.order.hasMany(db.orderItem, { foreignKey: 'orderId', onDelete: 'CASCADE', hooks: true });
db.orderItem.belongsTo(db.order, { foreignKey: 'orderId', onDelete: 'CASCADE' });

db.productVariant.hasMany(db.orderItem, { foreignKey: 'variantId' });
db.orderItem.belongsTo(db.productVariant, { foreignKey: 'variantId', onDelete: 'SET NULL' });

db.order.hasOne(db.payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
db.payment.belongsTo(db.order, { foreignKey: 'orderId' })


module.exports = db;