
export interface Variant {
    variantId: string;
    variantName: string;
    imageURL: string;
    price: number;
    attributes: Attribute[];
}

export interface Attribute {
    attributeID: string;
    attributeName: string;
    attributeValue: string;
}

export interface ProductResponse {
    data: Product;
}

export interface Product {
    variants: Variant[];
}