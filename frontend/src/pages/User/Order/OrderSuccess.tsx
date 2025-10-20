


import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrderSession, type OrderItem as CtxOrderItem } from "../../../../contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { BillSummary } from "@/components/Order/BillSummary";
import { useEffect, useMemo, useState } from "react";
import { listAddresses } from "@/services/address.services";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam = searchParams.get("sessionKey");
  const sessionKey = sessionKeyParam || "order:_:_";
  const flow = (searchParams.get("flow") || "online") as "online" | "cod";
  const { items, shippingMethod, paymentMethod, shippingAddressId } = useOrderSession(sessionKey);
  const [addresses, setAddresses] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listAddresses();
        if (mounted) setAddresses(rows || []);
      } catch (e) {
        console.warn("[OrderSuccess] failed to load addresses for display", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
  const shipping = 0;
  const discount = 0;
  const total = subtotal + shipping - discount;
  const paymentStatus = flow === "online" ? "Paid (Online)" : "Payment Due (Cash on Delivery)";
  const deliveryAddressText = useMemo(() => {
    if (shippingMethod !== 'standard' || !shippingAddressId) return undefined;
    const addr = addresses.find((a) => String(a.id) === String(shippingAddressId));
    if (!addr) return undefined;
    const parts = [addr.line1, addr.line2, addr.city, addr.postalCode].filter(Boolean);
    return parts.join(", ");
  }, [addresses, shippingMethod, shippingAddressId]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Order Successful</h1>
        <p className="text-muted-foreground">Thank you for your purchase! Your order has been recorded.</p>
      </div>

      <BillSummary
        title="Invoice"
        items={items.map((i: CtxOrderItem) => ({ id: i.id, name: i.name, unitPrice: i.unitPrice, quantity: i.quantity }))}
        shippingMethod={shippingMethod}
        paymentMethod={paymentMethod}
        deliveryAddressText={deliveryAddressText}
        paymentStatus={paymentStatus}
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        total={total}
      />

      <div className="flex gap-2">
        <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>
    </div>
  );
}
