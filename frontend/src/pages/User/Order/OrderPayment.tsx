import { BackHeader } from "@/components/Order/BackHeader";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import PaymentMethod  from "@/components/Order/PaymentMethod";
import ShippingMethod from "@/components/Order/ShippingMethod";
import ShippingAddressSection from "@/components/Order/ShippingAddressSection";
import { Separator } from "@/components/ui/separator";
import { useOrderSession } from "../../../../contexts/OrderContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
 

type ShippingChoice = "standard" | "pickup";
type PaymentChoice = "online" | "cod";

// tiny contract of what we need to pass to the next step
export type OrderSelections = {
  shippingMethod: ShippingChoice;
  paymentMethod: PaymentChoice;
  shippingAddressId?: string; 
};

export default function OrderPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionKeyParam: string | null = searchParams.get("sessionKey");
  const productId: string | null = searchParams.get("productId");
  const variantId: string | null = searchParams.get("variantId");
  const sessionKey = sessionKeyParam || `order:${productId || "_"}:${variantId || "_"}`;
  const { shippingMethod, setShippingMethod, paymentMethod, setPaymentMethod, shippingAddressId, setShippingAddressId, items } = useOrderSession(sessionKey);

  console.log(items);
  // compute summary values
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  
  const shipping = 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  // Guard against invalid direct access or missing session data
  // Consider the session invalid if there are no items.
  // Use a null-safe check in case `items` is undefined/null from the context.
  const isInvalid = !items || items.length === 0;
  if (isInvalid) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Invalid order session</h1>
        <p className="text-muted-foreground">Please return to the cart or product page and start checkout again.</p>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  // No forced payment change; COD is allowed for Store Pickup now

  return (
    <div className="space-y-8">
      <BackHeader title="Product Confirmation" />
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
          <ShippingMethod value={shippingMethod} onChange={setShippingMethod} />
          <Separator />
          {shippingMethod === "standard" ? (
            <ShippingAddressSection onSelectionChange={setShippingAddressId} />
          ) : null}
          <Separator />
          <PaymentMethod
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

        </div>
        <div className="md:col-span-1 space-y-8">
          <OrderSummaryCard
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            onNext={() => {
              // Guard: Standard Delivery requires a selected/default delivery address
              if (shippingMethod === "standard" && !shippingAddressId) {
                alert("Please add and select a delivery address to continue with Standard Delivery.");
                return;
              }
              // Navigate to summary screen; for online we'll show a Pay button, for COD a Place Order button
              const qs = new URLSearchParams(searchParams);
              const flow = paymentMethod; // "online" | "cod"
              qs.set("flow", flow);
              // Ensure sessionKey is propagated
              if (!qs.get("sessionKey")) {
                qs.set("sessionKey", sessionKey);
              }
              navigate(`/order/summary?${qs.toString()}`);
            }}
            nextLabel={paymentMethod === "online" ? "Proceed to Pay" : "Review & Confirm"}
          />
        </div>
      </div>
    </div>
  );
}

