


import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrderSession, type OrderItem as CtxOrderItem } from "../../../../contexts/OrderContext";
import { Button } from "@/components/ui/button";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam = searchParams.get("sessionKey");
  const sessionKey = sessionKeyParam || "order:_:_";
  const { items } = useOrderSession(sessionKey);

  // Guard invalid direct access
  const isInvalid = items.length === 0;
  if (isInvalid) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Invalid order session</h1>
        <p className="text-muted-foreground">Please return to the cart or product page and start checkout again.</p>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  const subtotal = items.reduce((sum: number, i: CtxOrderItem) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Order Successful</h1>
      <p className="text-muted-foreground">Thank you for your purchase! Your order has been recorded.</p>
      <div className="text-sm">
        <p>
          Items: {items.length} • Subtotal: $ {subtotal.toFixed(2)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        <Button variant="outline" onClick={() => navigate(`/`)}>Back to Home</Button>
      </div>
    </div>
  );
}
