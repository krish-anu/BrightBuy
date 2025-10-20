import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import QuantitySelector from "@/components/Products/QuantitySelector";
import { Trash2 } from "lucide-react";
import type { CartItem } from "../../../contexts/CartContext";

export function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
  selected,
  onSelectChange,
}: {
  item: CartItem;
  onRemove: (variantId: number) => void;
  onUpdateQuantity: (variantId: number, qty: number) => void;
  selected: boolean;
  onSelectChange: (variantId: number, next: boolean) => void;
}) {
  const attributesText = [
    item.color ? `Color: ${item.color}` : undefined,
    item.size ? `Size: ${item.size}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid grid-cols-11 gap-4 border rounded-md p-4 bg-background items-center">
      <div className="md:col-span-6 col-span-10 flex items-center gap-4 ">
        <div className=" flex items-center justify-center">
          <Checkbox
            checked={selected}
            onCheckedChange={(val) => onSelectChange(item.variantId, val === true)}
            aria-label={`Select ${item.name}`}
            className="h-5 w-5"
          />
        </div>
        <div className="aspect-square w-24 h-24 shrink-0">
          
            <img
              src={item.imageUrl?item.imageUrl:"src/assets/product-placeholder.png"}
              alt={item.name}
              className="w-full h-full object-cover rounded-md"
            />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg leading-snug line-clamp-2">
              {item.name}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 text-pretty break-word whitespace-normal">
              {attributesText}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center md:col-span-3 col-span-5">
        <QuantitySelector
          value={item.quantity}
          min={1}
          onChange={(q) => onUpdateQuantity(item.variantId, q)}
          className="w-full justify-center"
        />
      </div>

      <div className="flex items-center md:col-span-2 col-span-5 justify-end pr-2">
        <p className="font-bold text-base md:text-lg mr-2">
          $ {(item.price * item.quantity).toFixed(2)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.variantId)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
