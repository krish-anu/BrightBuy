'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Main Categories
    await queryInterface.bulkInsert('Categories', [
      { id: 1, name: 'Mobiles & Tablets', createdAt: now, updatedAt: now },
      { id: 2, name: 'Laptops & Computers', createdAt: now, updatedAt: now },
      { id: 3, name: 'Audio Devices', createdAt: now, updatedAt: now },
      { id: 4, name: 'Cameras & Photography', createdAt: now, updatedAt: now },
      { id: 5, name: 'Home Appliances', createdAt: now, updatedAt: now },
      { id: 6, name: 'Wearable & Smart Devices', createdAt: now, updatedAt: now },
      { id: 7, name: 'Power & Charging', createdAt: now, updatedAt: now },
      { id: 8, name: 'Personal Care & Health', createdAt: now, updatedAt: now },
      { id: 9, name: 'Security & Safety', createdAt: now, updatedAt: now },
      { id: 10, name: 'Toys & Gadgets', createdAt: now, updatedAt: now },
    ], {});

    // Subcategories
    await queryInterface.bulkInsert('Categories', [
      // Mobiles & Tablets
      { name: 'Smartphones', parentId: 1, createdAt: now, updatedAt: now },
      { name: 'Tablets', parentId: 1, createdAt: now, updatedAt: now },
      { name: 'Mobile Accessories', parentId: 1, createdAt: now, updatedAt: now },

      // Laptops & Computers
      { name: 'Laptops', parentId: 2, createdAt: now, updatedAt: now },
      { name: 'Storage Devices', parentId: 2, createdAt: now, updatedAt: now },
      { name: 'Cables & Adapters', parentId: 2, createdAt: now, updatedAt: now },
      { name: 'Computer Accessories', parentId: 2, createdAt: now, updatedAt: now },

      // Audio Devices
      { name: 'Earphones & Headphones', parentId: 3, createdAt: now, updatedAt: now },
      { name: 'Wireless Earbuds', parentId: 3, createdAt: now, updatedAt: now },
      { name: 'Speakers', parentId: 3, createdAt: now, updatedAt: now },

      // Cameras & Photography
      { name: 'Digital Cameras', parentId: 4, createdAt: now, updatedAt: now },
      { name: 'Action Cameras', parentId: 4, createdAt: now, updatedAt: now },
      { name: 'Camera Accessories', parentId: 4, createdAt: now, updatedAt: now },

      // Home Appliances
      { name: 'Kitchen Appliances', parentId: 5, createdAt: now, updatedAt: now },
      { name: 'Washing Machines', parentId: 5, createdAt: now, updatedAt: now },
      { name: 'Televisions', parentId: 5, createdAt: now, updatedAt: now },

      // Wearable & Smart Devices
      { name: 'Smartwatches', parentId: 6, createdAt: now, updatedAt: now },
      { name: 'Fitness Bands', parentId: 6, createdAt: now, updatedAt: now },
      { name: 'VR Devices', parentId: 6, createdAt: now, updatedAt: now },

      // Power & Charging
      { name: 'Power Banks', parentId: 7, createdAt: now, updatedAt: now },
      { name: 'Chargers & Docking Stations', parentId: 7, createdAt: now, updatedAt: now },
      { name: 'Batteries', parentId: 7, createdAt: now, updatedAt: now },

      // Personal Care & Health
      { name: 'Grooming Devices', parentId: 8, createdAt: now, updatedAt: now },
      { name: 'Health Devices', parentId: 8, createdAt: now, updatedAt: now },

      // Security & Safety
      { name: 'CCTV Cameras', parentId: 9, createdAt: now, updatedAt: now },
      { name: 'Alarms', parentId: 9, createdAt: now, updatedAt: now },
      { name: 'Smart Security Systems', parentId: 9, createdAt: now, updatedAt: now },

      // Toys & Gadgets
      { name: 'Electronic Toys', parentId: 10, createdAt: now, updatedAt: now },
      { name: 'Learning Gadgets', parentId: 10, createdAt: now, updatedAt: now },
      { name: 'Fun Gadgets', parentId: 10, createdAt: now, updatedAt: now },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
