// data/mock-products.ts

import type Product from "@/types/Product";

export const products: Product[] = [
  {
    id: "1",
    title: "Sample Headphones",
    image:
      "https://img.drz.lazcdn.com/static/lk/p/4f0bee59ec7f89f6d66c2fcf53b4c2b8.jpg_720x720q80.jpg_.webp",
    
    category: "Electronics and Telecommunication",
    variants: [
    {
      id: "v1",
      price: 1299.99,
      stock: 15,
      sku: "123456",
      attributes: [
        { name: "Color", value: "Red" },
        { name: "RAM", value: "8GB" },
        { name: "Storage", value: "128GB" }
      ]
    },
    {
      id: "v2",
      price: 1399.99,
      stock: 0,
      sku: "123457",
      attributes: [
        { name: "Color", value: "Blue" },
        { name: "RAM", value: "8GB" },
        { name: "Storage", value: "256GB" }
      ]
    },
    {
      id: "v3",
      price: 1499.99,
      stock: 8,
      sku: "123458",
      attributes: [
        { name: "Color", value: "Black" },
        { name: "RAM", value: "16GB" },
        { name: "Storage", value: "256GB" }
      ]
    },
    {
      id: "v4",
      price: 1599.99,
      stock: 5,
      sku: "123459",
      attributes: [
        { name: "Color", value: "White" },
        { name: "RAM", value: "16GB" },
        { name: "Storage", value: "512GB" }
      ]
    },
    {
      id: "v5",
      price: 1699.99,
      stock: 3,
      sku: "123460",
      attributes: [
        { name: "Color", value: "Green" },
        { name: "RAM", value: "16GB" },
        { name: "Storage", value: "1TB" }
      ]
    },
    {
      id: "v6",
      price: 1799.99,
      stock: 2,
      sku: "123461",
      attributes: [
        { name: "Color", value: "Gold" },
        { name: "RAM", value: "32GB" },
        { name: "Storage", value: "1TB" }
      ]
    },
    {
      id: "v7",
      price: 1899.99,
      stock: 1,
      sku: "123462",
      attributes: [
        { name: "Color", value: "Silver" },
        { name: "RAM", value: "32GB" },
        { name: "Storage", value: "2TB" }
      ]
    },
    // More variants...
  ],

    description: "High quality headphones for an immersive experience.",
  }
];