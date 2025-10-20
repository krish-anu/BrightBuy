import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dot } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProductDetail, Variant } from "@/types/ProductDetail";
import { useCart } from "../../../contexts/CartContext";
import {
  checkStock,
  findByOptions,
  getAttributeValues,
  getInitialOptions,
  getUniqueAttributes,
} from "@/utils/productVariantUtils";
import { formatCurrencyUSD } from "@/lib/utils";

interface ProductPageProps {
  product: ProductDetail;
}

export default function ProductInfo({ product }: ProductPageProps) {
  const { variants } = product;
  const { addItem } = useCart();
  const attributeNames = getUniqueAttributes(variants);
  const attributeValues = getAttributeValues(new Set(attributeNames), variants);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(getInitialOptions(variants));
  const [displayVariant, setDisplayVariant] = useState<Variant | undefined>(
    undefined,
  );
  const [stockStatus, setStockStatus] = useState<string>("");

  useEffect(() => {
    const variant = findByOptions(variants, selectedOptions);
    setDisplayVariant(variant);
    setStockStatus(checkStock(variant));
  }, [selectedOptions, variants]);

  function handleSelect(attrName: string, value: string) {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [attrName]: value,
    }));
  }

  return (
    <div className="flex flex-col gap-6 md:px-16 ">
      <div className=" inline-flex min-w-full min-h-64  flex-col md:flex-row gap-6">
        <div className="flex-1 md:max-w-1/3">
          <AspectRatio ratio={1 / 1}>
            <img
              src={displayVariant?.image ? displayVariant?.image : "/src/assets/product-placeholder.png"}
              className="object-cover w-full h-full rounded-md border-1"
            />
          </AspectRatio>
        </div>
        <div>
          <Separator orientation="vertical" className="hidden md:block" />{" "}
          <Separator className="block md:hidden" />{" "}
        </div>
        <div className="inline-flex flex-col gap-4 w-auto min-w-1/3 md:max-w-2/3">
          <div className="flex flex-col font-bold text-lg md:text-xl text-foreground wrap-break-word">
            <span> {product.name}</span>
          </div>
          <Separator />

          <div className="flex flex-col  font-black text-lg md:text-2xl text-secondary">
            {stockStatus === "not-available" ? (
              <span className="text-destructive ">
                Selected combination is not available
              </span>
            ) : (
              <span className="">{formatCurrencyUSD(displayVariant?.price ?? 0)}</span>
            )}
          </div>
          <Separator />
          <div className="flex flex-col gap-2 px-4 text-md md:text-lg text-foreground">
            <div className="flex flex-row justify-between">
              <span className="text-sm text-muted-foreground">
                SKU: {displayVariant?.SKU || "N/A"}
              </span>
              {stockStatus === "in-stock" ? (
                <Badge variant="outline" className="text-sm text-chart-3">
                  <span>
                    <Dot strokeWidth={3} size={16} className="inline-block" />
                    In Stock
                  </span>
                </Badge>
              ) : stockStatus === "low-stock" ? (
                <Badge variant="outline" className="text-sm text-chart-2">
                  <span>
                    <Dot strokeWidth={3} size={16} className="inline-block" />
                    Low Stock
                  </span>
                </Badge>
              ) : stockStatus === "out-of-stock" ? (
                <Badge variant="outline" className="text-sm text-destructive">
                  <span>
                    <Dot strokeWidth={3} size={16} className="inline-block" />
                    Out of Stock
                  </span>
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-row justify-between">
              <span className="text-sm text-muted-foreground">
                Category:{" "}
                <Badge variant="outline" className="text-sm text-muted-foreground">
                  {product.categories?.[0]?.name ?? "Uncategorized"}
                </Badge>
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-2 px-4 text-sm   md:text-md text-muted-foreground">
            {Object.entries(attributeValues).map(
              ([propName, propValues], index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col items-baseline gap-4"
                  >
                    <span className="font-semibold">
                      {propName}: <span className="text-foreground"></span>
                    </span>{" "}
                    {/* To DO: Show Selected Value here */}
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      className="flex flex-wrap gap-2 data-[variant=outline]:shadow-none shadow-none rounded-0  items-start"
                      value={selectedOptions[propName]}
                      onValueChange={(val) => {
                        if (val) handleSelect(propName, val);
                      }}
                      aria-label={propName}
                    >
                      {propValues.map((value) => {
                        return (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className="flex-none min-w-16 cursor-pointer data-[state=on]:bg-accent data-[state=on]:border-ring data-[state=on]:z-10  focus-visible:z-10 focus:shadow-none data-[state=on]:text-ring focus:border-1  data-[state=on]:outline-2  data-[state=on]:shadow-muted data-[state=on]:shadow-md whitespace-nowrap text-muted-foreground hover:text-muted-foreground "
                          >
                            {value}
                          </ToggleGroupItem>
                        );
                      })}
                    </ToggleGroup>
                  </div>
                );
              },
            )}
          </div>
          <Separator />

          {/* Show stock Quantity */}
          {stockStatus === "in-stock" ? (
            <span className="text-md text-muted-foreground">
              Available Stock:{" "}
              <span className="font-bold text-chart-3">
                {displayVariant?.stockQnt} 
              </span>
            </span>
          ) : null}

          {/* Quantity Selector - To Do */}


          {/* Action Buttons ( Buy Now / Add to Cart ) */}
          <div className="flex flex-row justify-start sm:gap-2 gap-6 text-md">
            {stockStatus === "not-available" ? null : (
              <Button
                variant="order"
                size="lg"
                className="hover:bg-foreground bg-primary  "
              >
                <ShoppingBagIcon className="inline-block mr-2" />{" "}
                {stockStatus === "in-stock"
                  ? "Buy Now"
                  : stockStatus === "out-of-stock"
                    ? "Pre Order"
                    : null}
              </Button>
            )}
            {stockStatus === "out-of-stock" ? null : (
              <Button
                variant="order_outline"
                size="lg"
                className="bg-primary-foreground text-secondary hover:bg-foreground hover:text-background"
                onClick={() => {
                  if (displayVariant) {
                    addItem({
                      variantId: parseInt(displayVariant.id),
                      productId: parseInt(product.id),
                      quantity: 1,
                      name: product.name,
                      price: displayVariant.price,
                      color: selectedOptions["Color"],
                      size: selectedOptions["Size"],
                      imageUrl: displayVariant.image,
                    });
                  }
                }}
              >
                <ShoppingCart className="inline-block mr-2" /> Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
      <Separator className="hidden md:block" />{" "}
      <Separator className="block md:hidden" />
      <div>{product.description}</div>
    </div>
  );
}
