import { BackHeader } from "@/components/Order/BackHeader";
import { OrderItemsSection } from "@/components/Order/OrderItemsSection";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import type { OrderItem } from "@/components/Order/OrderItemRow";
import {useSearchParams, useNavigate } from "react-router-dom";
import { useEffect,useState } from "react";
import  {getProductByID}  from "@/services/product.services";
import type {  Variant, Product, ProductResponse, Attribute } from "@/types/order";
import { useOrderSession } from "../../../../contexts/OrderContext";


export default function OrderConfirm() {
    const navigate = useNavigate();
    // Use a stable session key derived from URL params so multiple orders can co-exist
    const [searchParams] = useSearchParams();
    const productId: string | null = searchParams.get("productId");
    const variantId: string | null = searchParams.get("variantId");
    const sessionKey = `order:${productId || "_"}:${variantId || "_"}`;
    const { setItems: setGlobalItems } = useOrderSession(sessionKey);
    const [items, setLocalItems] = useState<OrderItem[]>([]);
    //get qty from search params
    const qty: number = Number(searchParams.get("qty") || "1");
    
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
                    setLocalItems([]);
                    setGlobalItems([]);
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
                const nextItems = [item];
                setLocalItems(nextItems);
                setGlobalItems(nextItems);
            });
        }
    }, [productId, qty, variantId, setGlobalItems]);


    // Calculate subtotal by computing lineTotal for each item
    const subtotal: number = items.reduce((sum: number, i: OrderItem) => sum + i.unitPrice * i.quantity, 0);
    const shipping: number = 0;  
    const discount: number = 0; 
    const total: number = subtotal + shipping - discount;

    // Guard: ensure URL has required params
    if (!productId || !variantId) {
        return (
            <div className="space-y-4 p-6">
                <h1 className="text-2xl font-bold">Invalid order session</h1>
                <p className="text-muted-foreground">Missing product or variant. Please navigate from the product page.</p>
            </div>
        );
    }
    if (!items.length) {
        return (
            <div className="space-y-4 p-6">
                <h1 className="text-2xl font-bold">Loading order…</h1>
                <p className="text-muted-foreground">Fetching product details. If this persists, go back and try again.</p>
            </div>
        );
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
                    onNext={() => {
                        // computes the same session key
                        const qs = searchParams.toString();
                        navigate(`/order/payment/${qs ? `?${qs}` : ""}`);
                    }}
                    className="mt-12"
                />
            </div>
        </div>
    );
}
