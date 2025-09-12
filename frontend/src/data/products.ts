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
    // More variants...
  ],

    description: "High quality headphones for an immersive experience.",
  }
];