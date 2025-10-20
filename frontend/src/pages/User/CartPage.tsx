import { useCart, type CartItem } from "../../../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyUSD } from "@/lib/utils";
import CartGuard from "@/components/Guards/CartGuard";

interface CartPageProps {
  items: CartItem[];
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  total: number;
  itemsCount: number;
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
            <div
              key={item.variantId}
              className="flex gap-4 bg-card p-4 rounded-lg shadow-sm"
            >
              <div className="w-24 h-24 bg-muted rounded-md overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.color && <p className="text-sm">Color: {item.color}</p>}
                    {item.size && <p className="text-sm">Size: {item.size}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrencyUSD(item.price)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrencyUSD(item.price * item.quantity)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleQuantityChange(item.variantId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          item.variantId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleQuantityChange(item.variantId, item.quantity + 1)
                      }
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.variantId)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Price</span>
                <span>{formatCurrencyUSD(total)}</span>
              </div>

              <Button className="w-full" size="lg">
                PROCEED TO CHECKOUT
              </Button>
            </div>
          </div>
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
