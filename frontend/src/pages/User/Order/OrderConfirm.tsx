import { BackHeader } from "@/components/Order/BackHeader";
import { OrderItemsSection } from "@/components/Order/OrderItemsSection";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import type { OrderItem } from "@/components/Order/OrderItemRow";
import { useNavigate } from "react-router-dom";

export default function OrderConfirm() {
    const navigate = useNavigate();

    // TODO: Replace with real data (single product or cart items)
    const items: OrderItem[] = [
        {
            id: 1,
            name: "Product Name",
            image: "/src/assets/product-placeholder.png",
            attributesText: "Size M, Color Red, Ram 8GB, Storage 256GB",
            unitPrice: 100,
            quantity: 4,
        },
        {
            id: 1,
            name: "Product Name",
            image: "/src/assets/product-placeholder.png",
            attributesText: "Size M, Color Red, Ram 8GB, Storage 256GB",
            unitPrice: 100,
            quantity: 4,
        },
        {
            id: 1,
            name: "Product Name",
            image: "/src/assets/product-placeholder.png",
            attributesText: "Size M, Color Red, Ram 8GB, Storage 256GB",
            unitPrice: 100,
            quantity: 4,
        },
        {
            id: 1,
            name: "Product Name",
            image: "/src/assets/product-placeholder.png",
            attributesText: "Size M, Color Red, Ram 8GB, Storage 256GB",
            unitPrice: 100,
            quantity: 4,
        },
    ];

    // Calculate subtotal by computing lineTotal for each item
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shipping = 0; // compute later
    const discount = 0; // compute later
    const total = subtotal + shipping - discount;

    return (
        <div className="space-y-8">
            <BackHeader title="Product Confirmation" />
            <div className="grid md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-8">
                    <OrderItemsSection items={items} />
                </div>
                <OrderSummaryCard
                    subtotal={subtotal}
                    shipping={shipping}
                    discount={discount}
                    total={total}
                    onNext={() => navigate("/order/payment/temp-id")}
                />
            </div>
        </div>
    );
}
