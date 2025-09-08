// data/mock-products.ts

import type Product from "@/types/Product";

export const products: Product[] = [
  {
    id: "1",
    title: "Sample Headphones",
    price: 1899.0,
    image:
      "https://img.drz.lazcdn.com/static/lk/p/4f0bee59ec7f89f6d66c2fcf53b4c2b8.jpg_720x720q80.jpg_.webp",
    sku: "123456",
    inStock: true,
    category: "Electronics and Telecommunication",
    properties: [
      { key: "Colors", values: ["red", "blue", "green", "black", "white", "yellow", "purple"] },
      { key: "Models", values: ["Redmi Note 13 C", "Redmi Note 12 C"] },
      { key: "Storage", values: ["64GB", "128GB", "256GB"] }
    ],
    description: "High quality headphones for an immersive experience.",
  },
  {
    id: "2",
    title: "Wireless Bluetooth Earbuds",
    price: 1299.0,
    image:
      "https://ae01.alicdn.com/kf/Sb8b6e2e7f2b94b7e8c2e2e2e2e2e2e2e2/True-Wireless-Earbuds.jpg_640x640.jpg",
    sku: "AEX1001",
    inStock: true,
    category: "Electronics > Audio",
    properties: [
      { key: "Colors", values: ["black", "white", "pink"] },
      { key: "Battery Life", values: ["4h", "8h", "12h"] },
      { key: "Bluetooth Version", values: ["5.0", "5.2"] }
    ],
    description: "Compact wireless earbuds with noise cancellation and touch controls.",
  },
  {
    id: "3",
    title: "Android Smart Watch",
    price: 2499.0,
    image:
      "https://ae01.alicdn.com/kf/Sa1b2c3d4e5f6g7h8i9j0/Smart-Watch.jpg_640x640.jpg",
    sku: "AEX1002",
    inStock: true,
    category: "Electronics > Smart Watches",
    properties: [
      { key: "Colors", values: ["black", "silver", "rose gold"] },
      { key: "Strap Material", values: ["silicone", "leather"] },
      { key: "Display", values: ["1.3 inch", "1.5 inch"] }
    ],
    description: "Feature-rich smart watch with heart rate monitor and fitness tracking.",
  },
  {
    id: "4",
    title: "Kids Educational Robot Toy",
    price: 1799.0,
    image:
      "https://ae01.alicdn.com/kf/Sf1e2d3c4b5a6/Robot-Toy.jpg_640x640.jpg",
    sku: "AEX2001",
    inStock: true,
    category: "Toys > Educational",
    properties: [
      { key: "Colors", values: ["white", "blue"] },
      { key: "Features", values: ["Voice Control", "Music", "Dancing"] }
    ],
    description: "Interactive robot toy for kids to learn and play.",
  },
  {
    id: "5",
    title: "Remote Control Racing Car",
    price: 999.0,
    image:
      "https://ae01.alicdn.com/kf/Sd4c3b2a1e5f6g7h8i9j/RC-Car.jpg_640x640.jpg",
    sku: "AEX2002",
    inStock: true,
    category: "Toys > Remote Control",
    properties: [
      { key: "Colors", values: ["red", "blue", "green"] },
      { key: "Battery", values: ["Rechargeable", "AA"] }
    ],
    description: "High-speed remote control car with durable build.",
  },
  {
    id: "6",
    title: "4K Action Camera",
    price: 3499.0,
    image:
      "https://ae01.alicdn.com/kf/Sa2b3c4d5e6f7g8h9i0j/Action-Camera.jpg_640x640.jpg",
    sku: "AEX1003",
    inStock: true,
    category: "Electronics > Cameras",
    properties: [
      { key: "Resolution", values: ["4K", "1080p"] },
      { key: "Waterproof", values: ["Yes"] },
      { key: "Accessories", values: ["Mount", "Extra Battery"] }
    ],
    description: "Waterproof action camera for outdoor adventures.",
  },
  {
    id: "7",
    title: "Building Blocks Puzzle Set",
    price: 599.0,
    image:
      "https://ae01.alicdn.com/kf/Sb1c2d3e4f5g6h7i8j9k/Building-Blocks.jpg_640x640.jpg",
    sku: "AEX2003",
    inStock: true,
    category: "Toys > Puzzles",
    properties: [
      { key: "Pieces", values: ["100", "200", "500"] },
      { key: "Material", values: ["Plastic"] }
    ],
    description: "Colorful building blocks to enhance creativity and logic.",
  },
  {
    id: "8",
    title: "Android Tablet 10 inch",
    price: 5999.0,
    image:
      "https://ae01.alicdn.com/kf/Sf9e8d7c6b5a4/Tablet.jpg_640x640.jpg",
    sku: "AEX1004",
    inStock: true,
    category: "Electronics > Tablets",
    properties: [
      { key: "Storage", values: ["64GB", "128GB"] },
      { key: "RAM", values: ["4GB", "6GB"] },
      { key: "Colors", values: ["black", "silver"] }
    ],
    description: "Affordable Android tablet for work and entertainment.",
  },
  {
    id: "9",
    title: "Fashion Doll with Accessories",
    price: 799.0,
    image:
      "https://ae01.alicdn.com/kf/Sd8c7b6a5e4f3g2h1i0j/Fashion-Doll.jpg_640x640.jpg",
    sku: "AEX2004",
    inStock: true,
    category: "Toys > Dolls",
    properties: [
      { key: "Accessories", values: ["Dress", "Shoes", "Bag"] },
      { key: "Height", values: ["30cm"] }
    ],
    description: "Beautiful fashion doll with multiple accessories.",
  },
  {
    id: "10",
    title: "Gaming Laptop 15.6 inch",
    price: 45999.0,
    image:
      "https://ae01.alicdn.com/kf/Sa7b6c5d4e3f2g1h0i9j/Gaming-Laptop.jpg_640x640.jpg",
    sku: "AEX1005",
    inStock: true,
    category: "Electronics > Laptops",
    properties: [
      { key: "Processor", values: ["i5", "i7"] },
      { key: "RAM", values: ["8GB", "16GB"] },
      { key: "Storage", values: ["512GB SSD", "1TB SSD"] }
    ],
    description: "High-performance gaming laptop with dedicated graphics.",
  },
];
