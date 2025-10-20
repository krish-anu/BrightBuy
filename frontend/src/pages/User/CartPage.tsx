import { useCart, type CartItem } from "../../../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CartGuard from "@/components/Guards/CartGuard";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import { CartItemsSection } from "@/components/Cart/CartItemsSection";
import { useMemo, useState } from "react";

interface CartPageProps {
  items: CartItem[];
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  itemsCount: number;
}

// Row component moved to components/Cart

function CartPageContent({ items, removeItem, updateQuantity, itemsCount }: CartPageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(items.map((i) => Number(i.variantId)))
  );

  const handleQuantityChange = (variantId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(variantId, newQuantity);
    }
  };

  const toggleSelect = (variantId: number, next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(Number(variantId));
      else copy.delete(Number(variantId));
      return copy;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(Number(i.variantId))),
    [items, selectedIds]
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((s, it) => s + it.price * it.quantity, 0),
    [selectedItems]
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link to="/products">
            <Button variant="outline" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Cart</h1>
          <p className="text-muted-foreground">Number of Items: {itemsCount}</p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items using shared cart section to mirror order page */}
        <div className="lg:col-span-2 space-y-4">
          <CartItemsSection
            items={items}
            onRemove={removeItem}
            onUpdateQuantity={handleQuantityChange}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </div>

        {/* Order Summary (reusing shared card) */}
        <div className="lg:col-span-1">
          <OrderSummaryCard
            subtotal={selectedSubtotal}
            shipping={0}
            discount={0}
            total={selectedSubtotal}
            onNext={() => {
              // Only proceed with selected items; if none, do nothing or prompt
              if (selectedItems.length === 0) return;
              // TODO: navigate to checkout with selectedItems
            }}
            nextLabel="PROCEED WITH SELECTED"
          />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemsCount } = useCart();
  
  return (
    <CartGuard>
      <CartPageContent items={items} removeItem={removeItem} updateQuantity={updateQuantity} itemsCount={itemsCount} />
    </CartGuard>
  );
}
