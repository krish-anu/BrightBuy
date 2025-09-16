
import ProductCard  from "@/components/Products/ProductCard";
import {products} from "@/data/products";

export default function ProductGrid(){
    return (
        <div className="product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}