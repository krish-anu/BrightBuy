export default interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  // properties: { key: string; values: string[] }[];
  ProductVariants: {
    id: string;
    sku: string;
    price: number;
    imageUrl?: string;
    stockQnt: number;
    attributes: {
      attributeID: string;
      attributeName: string;
      attributeValue: string;
    }[];
  }[];
}

export default interface SingleProduct{
  id: string;
  name: string;
  description: string;
  category: string;
  variants: {
    id: string;
    SKU: string;
    price: number;
    imageUrl?: string;
    stockQnt: number;
    attributes: {
      attributeID: string;
      attributeName: string;
      attributeValue: string;
    }[];
    categories: { id: number; name: string }[];
  }[];
}

// // Example of sample data based on the Product interface
// const sampleProduct: Product = {
//   id: "1",
//   title: "Sample Product",
//   description: "This is a sample product description.",
//   image: "https://example.com/sample-product.jpg",
//   category: "Electronics",
//   variants: [
//     {
//       id: "v1",
//       sku: "SP-001",
//       price: 99.99,
//       stockQnt: 50,
//       attributes: [
//         {
//           attributeID: "a1",
//           attributeName: "Color",
//           attributeValue: "Red",
//         },
//         {
//           attributeID: "a2",
//           attributeName: "Size",
//           attributeValue: "Medium",
//         },
//       ],
//     },
//     {
//       id: "v2",
//       sku: "SP-002",
//       price: 109.99,
//       stockQnt: 30,
//       attributes: [
//         {
//           attributeID: "a1",
//           attributeName: "Color",
//           attributeValue: "Blue",
//         },
//         {
//           attributeID: "a2",
//           attributeName: "Size",
//           attributeValue: "Large",
//         },
//       ],
//     },
//   ],
// };
