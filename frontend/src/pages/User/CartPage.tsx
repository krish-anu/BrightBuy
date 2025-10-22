import { useCart, type CartItem } from "../../../contexts/CartContext";
import { useOrderSession } from "../../../contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import CartGuard from "@/components/Guards/CartGuard";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import { CartItemsSection } from "@/components/Cart/CartItemsSection";
import { useMemo, useState } from "react";
import type { OrderItem } from "@/components/Order/OrderItemRow";

interface CartPageProps {
  items: CartItem[];
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  itemsCount: number;
}


function CartPageContent({ items, removeItem, updateQuantity, itemsCount }: CartPageProps) {
  const navigate = useNavigate();
  const [sessionKey] = useState<string>(() => `cart:${Date.now()}`);
  const { setItems: setOrderItems } = useOrderSession(sessionKey);
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
          <Link to="/shop">
            <Button variant="outline" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black">My Cart</h1>
          <p className="text-muted-foreground">Number of Items: {itemsCount}</p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-4">  

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Cart Items using shared cart section to mirror order page */}
        <div className="lg:col-span-3 space-y-4">
          <CartItemsSection
            items={items}
            onRemove={removeItem}
            onUpdateQuantity={handleQuantityChange}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <OrderSummaryCard
            subtotal={selectedSubtotal}
            shipping={0}
            // discount={0}
            total={selectedSubtotal}
            onNext={() => {
              // Only proceed with selected items; if none, do nothing
              if (selectedItems.length === 0) return;
              // Build OrderItem[] from selected cart items and store in global order session
              const nextItems: OrderItem[] = selectedItems.map((ci) => ({
                id: ci.variantId,
                name: ci.name,
                image: ci.imageUrl || "/src/assets/product-placeholder.png",
                unitPrice: Number(ci.price),
                quantity: ci.quantity,
                attributesText: [
                  ci.color ? `Color: ${ci.color}` : undefined,
                  ci.size ? `Size: ${ci.size}` : undefined,
                ]
                  .filter(Boolean)
                  .join(", "),
              }));
              setOrderItems(nextItems);
              const params = new URLSearchParams({ sessionKey });
              navigate(`/order/confirm?${params.toString()}`);
            }}
            nextLabel="Proceed with Selected"
            showShippingRow={false}
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
