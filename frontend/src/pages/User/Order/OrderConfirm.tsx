import { BackHeader } from "@/components/Order/BackHeader";
import { OrderItemsSection } from "@/components/Order/OrderItemsSection";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import type { OrderItem } from "@/components/Order/OrderItemRow";
import {useSearchParams, useNavigate } from "react-router-dom";
import { useEffect,useState } from "react";
import  {getProductByID}  from "@/services/product.services";
import type {  Variant, Product, ProductResponse, Attribute } from "@/types/order";


export default function OrderConfirm() {
    const navigate = useNavigate();
    const [items, setItems] = useState<OrderItem[]>([]);
    const [searchParams] = useSearchParams();

    //get productId and qty from search params
    const productId: string | null = searchParams.get("productId");
    const qty: number = Number(searchParams.get("qty") || "1");
    const variantId: string | null = searchParams.get("variantId");
    
    useEffect(() => {
        if (productId) {
            getProductByID(productId).then((response: ProductResponse) => {
                const product: Product = response.data;
                let selectedVariant: Variant | undefined;
                if (variantId && product.variants) {
                    selectedVariant = product.variants.find((v: Variant) => {
                        return v.variantId == String(variantId);
                    });
                }

                if (!selectedVariant) {
                    console.error("Variant not found");
                    setItems([]);
                    return;
                }

                const uniqueAttributes: Attribute[] = selectedVariant.attributes?.filter(
                    (attr: Attribute, idx: number, arr: Attribute[]) =>
                        arr.findIndex((a: Attribute) => a.attributeName === attr.attributeName && a.attributeValue === attr.attributeValue) === idx
                ) || [];
                const item: OrderItem = {
                    id: variantId,
                    name: selectedVariant.variantName,
                    image: selectedVariant.imageURL || "/src/assets/product-placeholder.png",
                    unitPrice: Number(selectedVariant.price),
                    quantity: qty,
                    attributesText: uniqueAttributes.map((a: Attribute) => `${a.attributeName}: ${a.attributeValue}`).join(", ")
                };
                setItems([item]);
            });
        }
    }, [productId, qty, variantId]);

    // Store in global state <To DO>

    // Calculate subtotal by computing lineTotal for each item
    const subtotal: number = items.reduce((sum: number, i: OrderItem) => sum + i.unitPrice * i.quantity, 0);
    const shipping: number = 0;  
    const discount: number = 0; 
    const total: number = subtotal + shipping - discount;

    if (!items.length) {
        return <div>Something Went wrong</div>;
    }

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
                    onNext={() => navigate("/order/payment/")}
                    className="mt-12"
                />
            </div>
        </div>
    );
}
