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

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected...");
  })
  .catch((err) => {
    console.log("Error " + err);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ====================== Models ======================
db.user = require("./user.model")(sequelize, DataTypes);
db.product = require("./product.model")(sequelize, DataTypes);
db.category = require("./category.model")(sequelize, DataTypes);
db.productCategory = require("./productCategory.model")(sequelize, DataTypes);
db.variantAttribute = require("./variantAttribute.model")(sequelize, DataTypes);
db.productVariant = require("./productVariant.model")(sequelize, DataTypes);
db.productVariantOption = require("./productVariantOption.model")(
  sequelize,
  DataTypes
);
db.order = require("./order.model")(sequelize, DataTypes);
db.orderItem = require("./orderItem.model")(sequelize, DataTypes);
db.payment = require("./payment.model")(sequelize, DataTypes);
db.city = require("./city.model")(sequelize, DataTypes);
db.categoryAttribute = require("./categoryAttribute.model")(sequelize, DataTypes);
db.address = require("./address.model")(sequelize, DataTypes);
db.delivery=require("./delivery.model")(sequelize,DataTypes)
// ====================== Associations ======================

// User ↔ Order
db.user.hasMany(db.order, { foreignKey: "userId" });
db.order.belongsTo(db.user, { foreignKey: "userId" });

// Category ↔ Subcategories (self relation)
db.category.hasMany(db.category, {
  as: "subcategories",
  foreignKey: "parentId",
  onDelete: "SET NULL",
});
db.category.belongsTo(db.category, {
  as: "parent",
  foreignKey: "parentId",
  onDelete: "SET NULL",
});

// Product ↔ Category (Many-to-Many)
db.product.belongsToMany(db.category, {
  through: db.productCategory,
  foreignKey: "productId",
  otherKey: "categoryId",
});
db.category.belongsToMany(db.product, {
  through: db.productCategory,
  foreignKey: "categoryId",
  otherKey: "productId",
});

// Category ↔ Attribute (Many-to-Many)
db.category.belongsToMany(db.variantAttribute, {
  through: db.categoryAttribute,
  foreignKey: "categoryId",
  otherKey: "attributeId"
});
db.variantAttribute.belongsToMany(db.category, {
  through: db.categoryAttribute,
  foreignKey: "attributeId",
  otherKey: "categoryId"
});

// ProductCategory (join table with optional extra fields, no PK override!)
db.productCategory.belongsTo(db.category, { foreignKey: "categoryId" });
db.productCategory.belongsTo(db.product, { foreignKey: "productId" });

// ProductVariant ↔ VariantAttribute (Many-to-Many via ProductVariantOption)
db.productVariant.belongsToMany(db.variantAttribute, {
  through: db.productVariantOption,
  foreignKey: "variantId",
  otherKey: "attributeId",
});
db.variantAttribute.belongsToMany(db.productVariant, {
  through: db.productVariantOption,
  foreignKey: "attributeId",
  otherKey: "variantId",
});

// ProductVariantOption belongsTo relations
db.productVariantOption.belongsTo(db.productVariant, {
  foreignKey: "variantId",
});
db.productVariantOption.belongsTo(db.variantAttribute, {
  foreignKey: "attributeId",
});

// Product ↔ ProductVariant
db.product.hasMany(db.productVariant, {
  foreignKey: "productId",
  onDelete: "CASCADE",
  hooks: true,
});
db.productVariant.belongsTo(db.product, { foreignKey: "productId" });

// Order ↔ OrderItem
db.order.hasMany(db.orderItem, {
  foreignKey: "orderId",
  onDelete: "CASCADE",
  hooks: true,
});
db.orderItem.belongsTo(db.order, {
  foreignKey: "orderId",
  onDelete: "CASCADE",
});

// ProductVariant ↔ OrderItem
db.productVariant.hasMany(db.orderItem, { foreignKey: "variantId" });
db.orderItem.belongsTo(db.productVariant, {
  foreignKey: "variantId",
  onDelete: "SET NULL",
});

// Order ↔ Payment
db.order.hasOne(db.payment, { foreignKey: "orderId", onDelete: "CASCADE" });
db.payment.belongsTo(db.order, { foreignKey: "orderId" });

// User ↔ Payment
db.user.hasMany(db.payment, { foreignKey: "userId" });
db.payment.belongsTo(db.user, { foreignKey: "userId" });

// City ↔ User
// db.city.hasMany(db.user, { foreignKey: "cityId" });
// db.user.belongsTo(db.city, { foreignKey: "cityId" });

// User ↔ Address
db.user.hasMany(db.address, { foreignKey: "userId" });
db.address.belongsTo(db.user, { foreignKey: "userId" });

// City ↔ Address
db.city.hasMany(db.address, { foreignKey: "cityId" });
db.address.belongsTo(db.city, { foreignKey: "cityId" });

// User(Delivery Staff) ↔ Delivery
db.user.hasMany(db.delivery, { foreignKey: "staffId" })
db.delivery.belongsTo(db.user,{foreignKey:"staffId"})

// Order↔ Delivery
db.order.hasOne(db.delivery, { foreignKey: "orderId" });
db.delivery.belongsTo(db.order, { foreignKey: "orderId" })


db.address.hasMany(db.order, { foreignKey: 'addressId' })
db.order.belongsTo(db.address,{foreignKey:'addressId'})


// ====================== Sync ======================
db.sequelize.sync({ force:false}).then(() => {
  console.log("Yes re-sync done");
});

module.exports = db;
