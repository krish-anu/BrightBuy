import { useParams } from "react-router-dom";
import {products} from "@/data/products";
import ProductInfo from "@/components/Products/ProductInfo";

export default function ProductDetailPage(){
    const { id } = useParams<{ id: string }>();
    const product = products.find((p) => p.id === id);
    if (!product) {
        return <div>Product not found</div>;
    }
    return <ProductInfo product={product} />;


}


