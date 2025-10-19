import { BackHeader } from "@/components/Order/BackHeader";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import PaymentMethod  from "@/components/Order/PaymentMethod";
import ShippingMethod from "@/components/Order/ShippingMethod";
import ShippingAddressSection from "@/components/Order/ShippingAddressSection";
import { Separator } from "@/components/ui/separator";
import { useState, useRef } from "react";

type ShippingChoice = "standard" | "pickup";
type PaymentChoice = "online" | "cod";

// tiny contract of what we need to pass to the next step
export type OrderSelections = {
  shippingMethod: ShippingChoice;
  paymentMethod: PaymentChoice;
  shippingAddressId?: string; // id from ShippingAddressSection
};

export default function OrderPayment() {
  const [shippingMethod, setShippingMethod] = useState<ShippingChoice>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>("online");
  const [shippingAddressId, setShippingAddressId] = useState<string | undefined>(undefined);

  // capture selections in a ref to avoid re-renders
  const selectionsRef = useRef<OrderSelections>({ shippingMethod, paymentMethod, shippingAddressId });
  selectionsRef.current = { shippingMethod, paymentMethod, shippingAddressId };

  // selectionRefs.current to 
  const getCurrentSelections = (): OrderSelections => selectionsRef.current;

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
            onNext={() => {}}
            nextLabel="Pay Now"
          />
        </div>
      </div>
    </div>
  );
}
