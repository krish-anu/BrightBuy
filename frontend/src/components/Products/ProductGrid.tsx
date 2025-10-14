import ProductCard from "@/components/Products/ProductCard";
import {getAllProducts} from "@/services/product.services";
import {useState, useEffect} from "react";
import type Product from "@/types/Product";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllProducts()
      .then(data => {
        console.log("API Fetched products:", data);
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load products");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }
  
  if (error) {
    return <div>{error}</div>;
  }

  if (products.length === 0) {
    return <div>No products available.</div>;
  }



  return (
    <div className="product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
