import {Card, CardContent, CardDescription, CardTitle, CardFooter} from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import type Product from "@/types/Product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="product-card rounded-md p-4 w-64">
      <CardContent className="px-0">
        <AspectRatio ratio={9/11} className="">
          <img src={product.imageUrl} alt={product.name} className="object-cover h-full w-full rounded-sm" />
        </AspectRatio>
        <CardTitle className="pt-4 text-lg">{product.name}</CardTitle>
        <CardDescription className="text-md">{product.description}</CardDescription>
        <span className="text-md">Price: <span className="font-bold text-secondary">{product.price} Rs</span></span>
      </CardContent>
      <CardFooter className="flex justify-around px-0">
        <Button className="w-full text-md font-bold h-10">Buy Now</Button>
      </CardFooter>
    </Card>
  );
}