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
        stockQnt: 15,
        sku: "123456",
        attributes: [
          {
            attributeID: "attr1",
            attributeName: "Color",
            attributeValue: "Red",
          },
          { attributeID: "attr2", attributeName: "RAM", attributeValue: "8GB" },
          {
            attributeID: "attr3",
            attributeName: "Storage",
            attributeValue: "128GB",
          },
        ],
      },
      {
        id: "v2",
        price: 1399.99,
        stockQnt: 0,
        sku: "123457",
        attributes: [
          {
            attributeID: "attr4",
            attributeName: "Color",
            attributeValue: "Blue",
          },
          { attributeID: "attr5", attributeName: "RAM", attributeValue: "8GB" },
          {
            attributeID: "attr6",
            attributeName: "Storage",
            attributeValue: "256GB",
          },
        ],
      },
      {
        id: "v3",
        price: 1499.99,
        stockQnt: 8,
        sku: "123458",
        attributes: [
          {
            attributeID: "attr7",
            attributeName: "Color",
            attributeValue: "Black",
          },
          {
            attributeID: "attr8",
            attributeName: "RAM",
            attributeValue: "16GB",
          },
          {
            attributeID: "attr9",
            attributeName: "Storage",
            attributeValue: "256GB",
          },
        ],
      },
      {
        id: "v4",
        price: 1599.99,
        stockQty: 5,
        sku: "123459",
        attributes: [
          {
            attributeID: "attr10",
            attributeName: "Color",
            attributeValue: "White",
          },
          {
            attributeID: "attr11",
            attributeName: "RAM",
            attributeValue: "16GB",
          },
          {
            attributeID: "attr12",
            attributeName: "Storage",
            attributeValue: "512GB",
          },
        ],
      },
      {
        id: "v5",
        price: 1699.99,
        stockQnt: 3,
        sku: "123460",
        attributes: [
          {
            attributeID: "attr13",
            attributeName: "Color",
            attributeValue: "Green",
          },
          {
            attributeID: "attr14",
            attributeName: "RAM",
            attributeValue: "16GB",
          },
          {
            attributeID: "attr15",
            attributeName: "Storage",
            attributeValue: "1TB",
          },
        ],
      },
      {
        id: "v6",
        price: 1799.99,
        stockQnt: 2,
        sku: "123461",
        attributes: [
          {
            attributeID: "attr16",
            attributeName: "Color",
            attributeValue: "Gold",
          },
          {
            attributeID: "attr17",
            attributeName: "RAM",
            attributeValue: "32GB",
          },
          {
            attributeID: "attr18",
            attributeName: "Storage",
            attributeValue: "1TB",
          },
        ],
      },
      {
        id: "v7",
        price: 1899.99,
        stockQnt: 1,
        sku: "123462",
        attributes: [
          {
            attributeID: "attr19",
            attributeName: "Color",
            attributeValue: "Silver",
          },
          {
            attributeID: "attr20",
            attributeName: "RAM",
            attributeValue: "32GB",
          },
          {
            attributeID: "attr21",
            attributeName: "Storage",
            attributeValue: "2TB",
          },
        ],
      },
    ],
    description: "High quality headphones for an immersive experience.",
  },
];
