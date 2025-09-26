import ProductInfo from "@/components/Products/ProductInfo";
import { useEffect, useState } from "react";
import { getProductByID } from "@/services/variant.services";
import { useParams } from "react-router-dom";

export default function ProductDetailPage() {
  const { productID } = useParams<{ productID: string }>();
  const [product, setProduct] = useState<any>(null);
  useEffect(() => {
    if (productID) {
      console.log("Fetching product with ID:", productID);
      getProductByID(productID).then((data) => {
        setProduct(data);
      });
    }
  }, [productID]);

  useEffect(() => {
    console.log("Fetched product data:", product);
  }, [product]);

  function ProductNotFound() {
    return <div>Product not found</div>;
  }
  if (!productID) {
    return <ProductNotFound />;
  }
  // return <ProductInfo product={product} />;
}
