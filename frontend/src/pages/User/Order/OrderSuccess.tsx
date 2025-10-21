


import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrderSession, type OrderItem as CtxOrderItem } from "../../../../contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { BillSummary } from "@/components/Order/BillSummary";
import { useEffect, useMemo, useState } from "react";
import { listAddresses } from "@/services/address.services";
import { verifyPaymentSuccess } from "@/services/payment.services";
import { getOrderById, type Order as BackendOrder } from "@/services/order.services";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam = searchParams.get("sessionKey");
  const sessionKey = sessionKeyParam || "order:_:_";
  const flow = (searchParams.get("flow") || "online") as "online" | "cod";
  const sessionId = searchParams.get("session_id");
  const { items, shippingMethod, paymentMethod, shippingAddressId } = useOrderSession(sessionKey);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(flow === "online");
  const [paid, setPaid] = useState(flow === "cod" ? true : false);
  const [error, setError] = useState<string | null>(null);
  const [backendOrder, setBackendOrder] = useState<BackendOrder | null>(null);
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

  // For online flow, verify payment with backend using session_id before showing success
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (flow !== "online") return; // COD handled separately
      if (!sessionId) {
        setError("Missing payment session. If you paid, please check your email for confirmation.");
        setLoading(false);
        return;
      }
      try {
        const resp = await verifyPaymentSuccess(sessionId);
        // Backend returns success: true even if unpaid, with data.paymentStatus
        const status = resp.data?.paymentStatus || "unpaid";
        if (!mounted) return;
        if (status === "paid") {
          setPaid(true);
          setError(null);
          const returnedOrder: any = resp.data?.order;
          const id = returnedOrder?.id;
          // Show what we have immediately (may not include items), then fetch full details
          if (returnedOrder) setBackendOrder(returnedOrder as BackendOrder);
          if (id) {
            try {
              const fullOrder = await getOrderById(Number(id));
              if (mounted) setBackendOrder(fullOrder);
            } catch (e) {
              console.warn("[OrderSuccess] failed to fetch full order details", e);
            }
          }
        } else {
          setPaid(false);
          setError("Payment not completed. If funds were deducted, contact support with your order details.");
        }
      } catch (e: any) {
        if (!mounted) return;
        console.error("[OrderSuccess] verify payment failed", e);
        setError(e?.message || "Failed to verify payment. Please refresh this page.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [flow, sessionId]);

  // Guard invalid direct access — allow if we have backend order or while loading verification
  const isInvalid = items.length === 0 && !backendOrder && !loading;
  if (isInvalid) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Invalid order session</h1>
        <p className="text-muted-foreground">Please return to the cart or product page and start checkout again.</p>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  // Prefer backend order details if available (post-payment), else fall back to local session
  const billItems = (backendOrder?.items && backendOrder.items.length > 0)
    ? backendOrder.items.map((i: any) => ({
        id: i.variantId ?? i.id,
        name: i.productName || i.variantName || `Item #${i.variantId ?? i.id}`,
        unitPrice: Number(i.unitPrice ?? i.price ?? 0),
        quantity: Number(i.quantity ?? 1),
      }))
    : items.map((i: CtxOrderItem) => ({ id: i.id, name: i.name, unitPrice: i.unitPrice, quantity: i.quantity }));

  const subtotal = (backendOrder?.items && backendOrder.items.length > 0)
    ? backendOrder.items.reduce((sum: number, i: any) => sum + Number(i.unitPrice ?? 0) * Number(i.quantity ?? 1), 0)
    : items.reduce((sum: number, i: CtxOrderItem) => sum + i.unitPrice * i.quantity, 0);

  const shipping = backendOrder ? Number(backendOrder.deliveryCharge ?? 0) : 0;
  const discount = 0;
  const total = backendOrder ? Number(backendOrder.totalPrice ?? (subtotal + shipping)) : (subtotal + shipping - discount);
  const paymentStatus = flow === "online" ? (paid ? "Paid (Online)" : "Unpaid") : "Payment Due (Cash on Delivery)";
  const deliveryAddressText = useMemo(() => {
    // Prefer backend-reported delivery address if present
    const deliveryMode = backendOrder?.deliveryMode || (shippingMethod === 'standard' ? 'Standard Delivery' : 'Store Pickup');
    if (deliveryMode === 'Standard Delivery') {
      // 1) Backend may provide a composed address string
      const backendAddress = (backendOrder as any)?.deliveryAddress;
      if (backendAddress && typeof backendAddress === 'string') return backendAddress;
      // 2) Fallback to selected address from session (if still available)
      if (!shippingAddressId) return undefined;
      const addr = addresses.find((a) => String(a.id) === String(shippingAddressId));
      if (!addr) return undefined;
      const parts = [addr.line1, addr.line2, addr.city, addr.postalCode].filter(Boolean);
      return parts.join(', ');
    }
    return undefined;
  }, [addresses, backendOrder, shippingMethod, shippingAddressId]);

  return (
    <div className="space-y-6 p-6">
      {loading ? (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Verifying payment…</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment status.</p>
        </div>
      ) : error ? (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Payment Verification</h1>
          <p className="text-red-600">{error}</p>
          <div>
            <Button variant="outline" onClick={() => navigate("/order/payment?sessionKey=" + sessionKey)}>Return to Payment</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Order Successful</h1>
          <p className="text-muted-foreground">Thank you for your purchase! Your order has been recorded.</p>
        </div>
      )}

      <BillSummary
        title="Invoice"
        items={billItems}
        shippingMethod={backendOrder ? (backendOrder.deliveryMode === 'Standard Delivery' ? 'standard' : 'pickup') : shippingMethod}
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
