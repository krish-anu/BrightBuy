import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"
import { Dot } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon ,ShoppingCart } from "lucide-react"; 
import type Product from "@/types/Product";

interface ProductPageProps {
    product: Product;
}



export default function ProductInfo({ product }: ProductPageProps) {
    return (
        <div className="flex flex-col gap-6 md:px-16 ">
            <div className=" inline-flex min-w-full min-h-64  flex-col md:flex-row gap-6">
                <div className="flex-1 md:max-w-1/3">
                    <AspectRatio ratio={1 / 1}>
                        <img src={product.image} className="object-cover w-full h-full rounded-md border-1" />
                    </AspectRatio>
                </div>
                <div><Separator orientation="vertical" className="hidden md:block" /> <Separator className="block md:hidden" /> </div>
                <div className="inline-flex flex-col gap-4 w-auto min-w-1/3 md:max-w-2/3">
                    <div className="flex flex-col font-bold text-lg md:text-xl text-foreground wrap-break-word">
                        <span > {product.title}</span>
                    </div>
                    <Separator />

                    <div className="flex flex-col  font-black text-lg md:text-2xl text-secondary">
                        <span className="">LKR {product.price}</span>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-2 px-4 text-md md:text-lg text-foreground">
                        <div className="flex flex-row justify-between">
                            <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                            <Badge variant="outline" className="text-sm text-chart-3"><span><Dot strokeWidth={3} size={16} className="inline-block" />In stock</span></Badge>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-sm text-muted-foreground">Category: <Badge variant="outline" className="text-sm text-muted-foreground">{product.category}</Badge></span>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-2 px-4 text-sm   md:text-md text-muted-foreground">
                        {product.properties.map((prop, index) => {
                            const propName = prop.key;
                            const propValues = prop.values;

                            return (
                                <div key={index} className="flex flex-col items-baseline gap-4">
                                    <span className="font-semibold">{propName}: <span className="text-foreground"></span></span>  {/* To DO: Show Selected Value here */}
                                    <ToggleGroup type="single" variant="outline" className="flex flex-wrap gap-2 data-[variant=outline]:shadow-none shadow-none rounded-0  items-start" defaultValue={propValues[0]} aria-label={propName}>
                                        {
                                            propValues.map((value) => (
                                                <ToggleGroupItem key={value} value={value} className="flex-none min-w-16 data-[state=on]:bg-accent data-[state=on]:border-ring data-[state=on]:z-10  focus-visible:z-10 focus:shadow-none data-[state=on]:text-ring focus:border-1  data-[state=on]:outline-2  data-[state=on]::shadow-muted data-[state=on]:shadow-md whitespace-nowrap text-muted-foreground hover:text-muted-foreground ">{value}</ToggleGroupItem>
                                            ))
                                        }
                                    </ToggleGroup>
                                </div>
                            );

                        })}

                    </div>
                    <Separator />
                    <div className="flex flex-row justify-start sm:gap-2 gap-6 text-md">
                        <Button variant="order" size="lg" className="hover:bg-foreground  "><ShoppingBagIcon className="inline-block mr-2" />Buy Now</Button>
                        <Button variant="order" size="lg" className="bg-primary text-primary-foreground hover:bg-foreground  hover:text-background"> <ShoppingCart className="inline-block mr-2" />Add to Cart</Button>
                    </div>
                </div>
            </div>
            <Separator className="hidden md:block" /> <Separator className="block md:hidden" />
            <div>
                {product.description}
            </div>
        </div>
    );
}




export function getUniqueAttributes(variants: { id: string; price: number; stock: number; attributes: { name: string; value: string }[] }[]) {
    const uniqueAttributes = new Map<string, Set<string>>();

    variants.forEach(variant => {
        variant.attributes.forEach(attr => {
            if (!uniqueAttributes.has(attr.name)) {
                uniqueAttributes.set(attr.name, new Set());
            }
            uniqueAttributes.get(attr.name)?.add(attr.value);
        });
    });

    return uniqueAttributes;
}