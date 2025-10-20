import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrderSession, type OrderItem as CtxOrderItem } from "../../../../contexts/OrderContext";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { createOrder } from "@/services/order.services";

export default function OrderSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam = searchParams.get("sessionKey");
  const flow = (searchParams.get("flow") || "online") as "online" | "cod";
  const sessionKey = sessionKeyParam || "order:_:_";
  const { items, shippingMethod, paymentMethod, shippingAddressId } = useOrderSession(sessionKey);

  const subtotal = items.reduce((sum: number, i: CtxOrderItem) => sum + i.unitPrice * i.quantity, 0);
  const shipping = 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

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

  const onPayOnline = async () => {
    // Basic step: simulate redirect to Stripe checkout page and back
    // In a real flow: call backend to create checkout session, then redirect to the returned URL
    // For now, just navigate back here to simulate return
    const qs = new URLSearchParams(searchParams);
    if (!qs.get("sessionKey")) qs.set("sessionKey", sessionKey);
    qs.set("flow", "online");
    navigate(`/order/success?${qs.toString()}`);
  };

  const onPlaceOrder = async () => {
    try {
      // Map frontend shipping to backend delivery mode
      const deliveryMode = shippingMethod === "standard" ? "Standard Delivery" : "Store Pickup";
      const paymentMethodBackend = "CashOnDelivery" as const;

      // Disallow COD + Store Pickup (backend will 400, so pre-guard here)
      if (deliveryMode === "Store Pickup") {
        alert("Cash on Delivery is not allowed for Store Pickup. Please choose Online payment.");
        const qs = new URLSearchParams(searchParams);
        if (!qs.get("sessionKey")) qs.set("sessionKey", sessionKey);
        navigate(`/order/payment?${qs.toString()}`);
        return;
      }

      // Build items payload
      const payloadItems = items.map((i) => ({
        variantId: Number(i.id) || String(i.id),
        quantity: i.quantity,
      }));

      // Require a shipping address ID for Standard Delivery
      if (!shippingAddressId) {
        alert("Please select a shipping address to place a COD order.");
        const qs = new URLSearchParams(searchParams);
        if (!qs.get("sessionKey")) qs.set("sessionKey", sessionKey);
        navigate(`/order/payment?${qs.toString()}`);
        return;
      }

      // Prefer numeric ID if possible
      const deliveryAddressId = isNaN(Number(shippingAddressId)) ? shippingAddressId : Number(shippingAddressId);

      const payload = {
        items: payloadItems,
        deliveryMode: deliveryMode as "Standard Delivery" | "Store Pickup",
        paymentMethod: paymentMethodBackend,
        deliveryAddressId,
      } as const;

      await createOrder(payload as any);

      // On success, redirect to success page with session params
  const qs = new URLSearchParams(searchParams);
  if (!qs.get("sessionKey")) qs.set("sessionKey", sessionKey);
  qs.set("flow", "cod");
  navigate(`/order/success?${qs.toString()}`);
    } catch (err: any) {
      const backend = err?.original?.response?.data || err?.response?.data;
      const msg = (backend && (backend.message || backend.error)) || err?.message || "Failed to place order";
      console.error("[OrderSummary] COD place order failed", backend || err);
      alert(msg);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Order Summary</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <ul className="space-y-2">
              {items.map((i: CtxOrderItem) => (
                <li key={`${i.id}`} className="flex justify-between">
                  <span>{i.name} x {i.quantity}</span>
                  <span>$ {(i.unitPrice * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold">Shipping</h2>
            <p>Method: {shippingMethod}</p>
          </div>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold">Payment</h2>
            <p>Method: {paymentMethod}</p>
          </div>
        </div>
        <div className="md:col-span-1">
          <OrderSummaryCard
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            onNext={flow === "online" ? onPayOnline : onPlaceOrder}
            nextLabel={flow === "online" ? "Pay with Stripe" : "Place Order"}
          />
          {flow === "online" ? (
            <p className="text-sm text-muted-foreground mt-2">You will be redirected to Stripe to complete payment.</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Please review your order. Click Place Order to confirm Cash on Delivery.</p>
          )}
        </div>
      </div>
      <div>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}