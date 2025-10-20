import { BackHeader } from "@/components/Order/BackHeader";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import PaymentMethod  from "@/components/Order/PaymentMethod";
import ShippingMethod from "@/components/Order/ShippingMethod";
import ShippingAddressSection from "@/components/Order/ShippingAddressSection";
import { Separator } from "@/components/ui/separator";
import { useOrderSession } from "../../../../contexts/OrderContext";
import { useSearchParams } from "react-router-dom";

type ShippingChoice = "standard" | "pickup";
type PaymentChoice = "online" | "cod";

// tiny contract of what we need to pass to the next step
export type OrderSelections = {
  shippingMethod: ShippingChoice;
  paymentMethod: PaymentChoice;
  shippingAddressId?: string; 
};

export default function OrderPayment() {
  const [searchParams] = useSearchParams();
  const productId: string | null = searchParams.get("productId");
  const variantId: string | null = searchParams.get("variantId");
  const sessionKey = `order:${productId || "_"}:${variantId || "_"}`;
  const { shippingMethod, setShippingMethod, paymentMethod, setPaymentMethod, shippingAddressId, setShippingAddressId, items } = useOrderSession(sessionKey);

  return (
    <div className="space-y-8">
      <BackHeader title="Product Confirmation" />
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
          <ShippingMethod value={shippingMethod} onChange={setShippingMethod} />
          <Separator />
          <ShippingAddressSection onSelectionChange={setShippingAddressId} />
          <Separator />
          <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />

        </div>
        <div className="md:col-span-1 space-y-8">
          <OrderSummaryCard
            subtotal={400}
            shipping={0}
            discount={0}
            total={400}
            onNext={() => {
              alert(`Proceeding with:\nItems: ${items.length}\nShipping: ${shippingMethod}\nPayment: ${paymentMethod}\nAddressId: ${shippingAddressId || "(none)"}`)
            }}
            nextLabel="Pay Now"
          />
        </div>
      </div>
    </div>
  );
}
