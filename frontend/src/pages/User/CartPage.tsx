import { useCart, type CartItem } from "../../../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import CartGuard from "@/components/Guards/CartGuard";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";

interface CartPageProps {
  items: CartItem[];
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  total: number;
  itemsCount: number;
}

function CartItemRow({ item, onRemove, onUpdateQuantity }: { item: CartItem; onRemove: (id: number) => void; onUpdateQuantity: (id: number, qty: number) => void }) {
  const dec = () => onUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1));
  const inc = () => onUpdateQuantity(item.variantId, item.quantity + 1);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    onUpdateQuantity(item.variantId, Number.isFinite(v) && v > 0 ? v : 1);
  };

  return (
    <div className="grid grid-cols-10 gap-4 border rounded-md p-4 bg-background">
      <div className="md:col-span-6 col-span-10 flex gap-4">
        <div className="aspect-square w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg leading-snug line-clamp-2">{item.name}</h2>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 whitespace-normal">
              {[item.color && `Color: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-center justify-between md:col-span-2 col-span-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={dec} disabled={item.quantity <= 1}>
            <MinusCircle className="h-4 w-4" />
          </Button>
          <Input type="number" min={1} value={item.quantity} onChange={onChange} className="w-16 text-center" />
          <Button variant="ghost" size="icon" onClick={inc}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between md:col-span-2 col-span-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onRemove(item.variantId)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-bold text-base md:text-lg">$ {(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
}

function CartPageContent({ items, removeItem, updateQuantity, total, itemsCount }: CartPageProps) {

  const handleQuantityChange = (variantId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(variantId, newQuantity);
    }
  };

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
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: CartItem) => (
            <CartItemRow key={item.variantId} item={item} onRemove={removeItem} onUpdateQuantity={handleQuantityChange} />
          ))}
        </div>

        {/* Order Summary (reusing shared card) */}
        <div className="lg:col-span-1">
          <OrderSummaryCard
            subtotal={items.reduce((s, it) => s + it.price * it.quantity, 0)}
            shipping={0}
            discount={0}
            total={total}
            onNext={() => {/* TODO: hook up checkout route */}}
            nextLabel="PROCEED TO CHECKOUT"
          />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemsCount } = useCart();
  
  return (
    <CartGuard>
      <CartPageContent
        items={items}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        total={total}
        itemsCount={itemsCount}
      />
    </CartGuard>
  );
}
