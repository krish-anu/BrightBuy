import type { CartItem } from "../../../contexts/CartContext";
import { CartItemRow } from "@/components/Cart/CartItemRow";

export function CartItemsSection({
  items,
  onRemove,
  onUpdateQuantity,
  selectedIds,
  onToggleSelect,
}: {
  items: CartItem[];
  onRemove: (variantId: number) => void;
  onUpdateQuantity: (variantId: number, qty: number) => void;
  selectedIds: Set<number>;
  onToggleSelect: (variantId: number, next: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md">
      <h2 className="text-xl md:text-2xl font-bold">Your Cart</h2>
      <div className="flex flex-col gap-4">
        {items
          .filter((it) => Number.isFinite(Number(it.variantId)))
          .map((it) => (
            <CartItemRow
              key={Number(it.variantId)}
              item={it}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
              selected={selectedIds.has(Number(it.variantId))}
              onSelectChange={onToggleSelect}
            />
          ))}
      </div>
    </section>
  );
}
