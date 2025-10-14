export interface Attribute {
  attributeID: string;
  attributeName: string;
  attributeValue: string;
}

export interface Variant {
  id: string;
  SKU: string;
  price: number;
  stockQnt: number;
  image?: string;
  attributes: Attribute[];
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  categories?: Category[];
}
