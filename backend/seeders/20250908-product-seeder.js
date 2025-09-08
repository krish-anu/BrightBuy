'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 1️⃣ Products (without price and stockQnt)
    await queryInterface.bulkInsert('Products', [
      {
        id: 1,
        name: "AirPods Pro",
        description: "Apple AirPods Pro with Active Noise Cancellation",
        brand: "Apple",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        name: "iPhone 12 Pro",
        description: "Apple iPhone 12 Pro",
        brand: "Apple",
        createdAt: now,
        updatedAt: now
      }
    ], {});

    // 2️⃣ Product → Category
    await queryInterface.bulkInsert('ProductCategories', [
      { productId: 1, categoryId: 3, createdAt: now, updatedAt: now },
      { productId: 2, categoryId: 1, createdAt: now, updatedAt: now }
    ], {});

    // 3️⃣ Product Variants
    await queryInterface.bulkInsert('ProductVariants', [
      {
        id: 1,
        variantName: "iPhone 12 Pro",
        productId: 2,
        price: 1200.00,
        stockQnt: 10,
        createdAt: now,
        updatedAt: now
      }
    ], {});

    // 4️⃣ Variant Attributes
    await queryInterface.bulkInsert('VariantAttributes', [
      { id: 1, name: "Color", createdAt: now, updatedAt: now },
      { id: 2, name: "Wireless", createdAt: now, updatedAt: now },
      { id: 3, name: "Storage", createdAt: now, updatedAt: now }
    ], {});

    // 5️⃣ Map Variant Attributes to Product Variants
    await queryInterface.bulkInsert('ProductVariantOptions', [
      { variantId: 1, attributeId: 1, value: "Black", createdAt: now, updatedAt: now },
      { variantId: 1, attributeId: 3, value: "256GB", createdAt: now, updatedAt: now }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ProductVariantOptions', null, {});
    await queryInterface.bulkDelete('VariantAttributes', null, {});
    await queryInterface.bulkDelete('ProductVariants', null, {});
    await queryInterface.bulkDelete('ProductCategories', null, {});
    await queryInterface.bulkDelete('Products', null, {});
  }
};
