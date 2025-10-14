import ProductInfo from "@/components/Products/ProductInfo";
import { useEffect, useState } from "react";
import { getProductByID } from "@/services/product.services";
import { useParams } from "react-router-dom";

export default function ProductDetailPage() {
  const { productID } = useParams<{ productID: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productID) {
      console.log("Fetching product with ID:", productID);
      setLoading(true);
      getProductByID(productID)
        .then((data) => {
          console.log("Fetched product data:", data);
          setProduct(data.data); 
        })
        .catch((error) => {
          console.error("Failed to fetch product:", error);
          setProduct(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productID]);

  function ProductNotFound() {
    return <div>Product not found</div>;
  }

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show not found if no productID
  if (!productID) {
    return <ProductNotFound />;
  }

  // Show not found if product is null
  if (!product) {
    return <ProductNotFound />;
  }

  // Render ProductInfo component (not call as function)
  return <ProductInfo product={product} />;
}
