export default interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  // properties: { key: string; values: string[] }[];
  variants: { id: string; sku: string; price: number; stock: number; attributes: { name: string; value: string }[] }[];
}