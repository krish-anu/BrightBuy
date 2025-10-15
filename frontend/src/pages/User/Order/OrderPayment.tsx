import { BackHeader } from "@/components/Order/BackHeader";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import PaymentMethod  from "@/components/Order/PaymentMethod";
import ShippingMethod from "@/components/Order/ShippingMethod";
import ShippingAddressSection from "@/components/Order/ShippingAddressSection";

export default function OrderPayment() {
  return (
    <div className="space-y-8">
      <BackHeader title="Product Confirmation" />
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
          <ShippingMethod/>
          {/* TODO Shipping Address */}
          <ShippingAddressSection />
          <PaymentMethod/>

        </div>
        <div className="md:col-span-1 space-y-8">
          <OrderSummaryCard
            subtotal={400}
            shipping={0}
            discount={0}
            total={400}
            onNext={() => alert("Proceed to Payment (functionality coming soon)")}
            nextLabel="Pay Now"
          />
        </div>
      </div>
    </div>
  );
}
