import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrderSession, type OrderItem as CtxOrderItem } from "../../../../contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { createOrder } from "@/services/order.services";
import { BillSummary } from "@/components/Order/BillSummary";
import { listAddresses } from "@/services/address.services";
import { useEffect, useMemo, useState } from "react";

export default function OrderSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam = searchParams.get("sessionKey");
  const flow = (searchParams.get("flow") || "online") as "online" | "cod";
  const sessionKey = sessionKeyParam || "order:_:_";
  const { items, shippingMethod, paymentMethod, shippingAddressId } = useOrderSession(sessionKey);

  // Fetch addresses to format the selected one for display
  const [addresses, setAddresses] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listAddresses();
        if (mounted) setAddresses(rows || []);
      } catch (e) {
        console.warn("[OrderSummary] failed to load addresses for display", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const deliveryAddressText = useMemo(() => {
    if (!shippingAddressId) return undefined;
    const addr = addresses.find((a) => String(a.id) === String(shippingAddressId));
    if (!addr) return `Address #${shippingAddressId}`;
    // Common fields from backend: line1, line2, city, postalCode
    const parts = [addr.line1, addr.line2, addr.city, addr.postalCode].filter(Boolean);
    return parts.join(", ");
  }, [addresses, shippingAddressId]);

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
    <div className="space-y-6">
      <BillSummary
        title="Bill Summary"
        items={items.map((i: CtxOrderItem) => ({
          id: i.id,
          name: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        }))}
        shippingMethod={shippingMethod}
        paymentMethod={paymentMethod}
        deliveryAddressText={shippingMethod === "standard" ? deliveryAddressText : undefined}
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        total={total}
        onNext={flow === "online" ? onPayOnline : onPlaceOrder}
        nextLabel={flow === "online" ? "Pay with Stripe" : "Place Order"}
      />
      <div>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}