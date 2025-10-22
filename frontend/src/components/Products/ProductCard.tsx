import { Card, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
// Accept flexible product shapes from different endpoints (variant-centric or flattened)
import { formatCurrencyUSD } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  // support both shapes returned by different endpoints:
  // - variant-centric: has ProductVariants array
  // - flattened/popular feed: has imageUrl/imageURL and price at top-level
  const productPageId = product.productId ?? product.id ?? "";
  const title = product.productName ?? product.name ?? "";
  const imageSrc =
    product.imageURL ?? product.imageUrl ?? product.ProductVariants?.[0]?.imageUrl ?? "/src/assets/product-placeholder.png";
  const price = Number(product.price ?? product.ProductVariants?.[0]?.price ?? 0);

  return (
    <Card className="product-card rounded-md p-4 w-64">
      <CardContent className="px-0 group">
        <AspectRatio ratio={9 / 11} className="">
          <img
            src={imageSrc}
            alt={title}
            className="object-cover h-full w-full rounded-sm transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </AspectRatio>
        <CardTitle className="pt-4 text-lg">{title}</CardTitle>
        <span className="text-md md:text-lg font-bold text-secondary">{formatCurrencyUSD(price)}</span>
      </CardContent>
      <CardFooter className="flex justify- px-0">
        <Link to={`/products/${productPageId}`} className="w-full">
          <Button variant="order" size="lg" className="w-full text-md font-bold ">
            <ShoppingBag className="inline-block mr-2" />
            Buy Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
