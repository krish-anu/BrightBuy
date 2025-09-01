export default interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  sku: string;
  inStock: boolean;
  category: string;
  properties: { key: string; values: string[] }[];
}