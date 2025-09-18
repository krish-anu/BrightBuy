import {Card, CardContent, CardTitle, CardFooter} from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import type Product from "@/types/Product";
import {Link} from "react-router-dom";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="product-card rounded-md p-4 w-64">
      <CardContent className="px-0">
        <AspectRatio ratio={9/11} className="">
          <img src={product.image} alt={product.title} className="object-cover h-full w-full rounded-sm" />
        </AspectRatio>
        <CardTitle className="pt-4 text-lg">{product.title}</CardTitle>
        {/* <CardDescription className="text-md">{product.description}</CardDescription> */}
<span className="text-md md:text-lg font-bold text-secondary">
  LKR {product.variants[0]?.price ?? 0}
</span>
      </CardContent>
      <CardFooter className="flex justify- px-0">
        <Link to={`/products/${product.id}`} className="w-full">
          <Button variant="order" size="lg" className="w-full text-md font-bold "><ShoppingBag className="inline-block mr-2" />Buy Now</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}