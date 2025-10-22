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
    const sessionKeyParam: string | null = searchParams.get("sessionKey");
    const productId: string | null = searchParams.get("productId");
    const variantId: string | null = searchParams.get("variantId");
    const sessionKey = sessionKeyParam || `order:${productId || "_"}:${variantId || "_"}`;
    const { setItems: setGlobalItems, items: globalItems } = useOrderSession(sessionKey as string);
    const [items, setLocalItems] = useState<OrderItem[]>([]);
    //get qty from search params (single-item fallback)
    const qty: number = Number(searchParams.get("qty") || "1");
    
    useEffect(() => {
        // If URL carries product + variant, treat it as the source of truth for this session
        if (productId && variantId) {
            getProductByID(productId).then((response: ProductResponse) => {
                const product: Product = response.data;
                let selectedVariant: Variant | undefined;
                if (product.variants) {
                    selectedVariant = product.variants.find((v: Variant | any) => {
                        const vid = (v as any)?.variantId ?? (v as any)?.id;
                        return String(vid) === String(variantId);
                    }) as Variant | undefined;
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
                    name: (selectedVariant as any).variantName ?? (selectedVariant as any).name ?? "Variant",
                    image: (selectedVariant as any).imageURL || (selectedVariant as any).image || "/src/assets/product-placeholder.png",
                    unitPrice: Number(selectedVariant.price),
                    quantity: qty,
                    attributesText: uniqueAttributes.map((a: Attribute) => `${a.attributeName}: ${a.attributeValue}`).join(", ")
                };
                const nextItems = [item];
                setLocalItems(nextItems);
                // Only update global if there is a meaningful difference
                const same = (
                    Array.isArray(globalItems) &&
                    globalItems.length === 1 &&
                    String(globalItems[0]?.id) === String(variantId) &&
                    Number(globalItems[0]?.quantity) === Number(qty) &&
                    Number(globalItems[0]?.unitPrice) === Number(selectedVariant?.price)
                );
                if (!same) setGlobalItems(nextItems);
            });
            return;
        }
        // Fallback: if no URL product context, use what we have in session (e.g., cart flow)
        if (globalItems && globalItems.length > 0) {
            setLocalItems(globalItems);
        } else {
            setLocalItems([]);
        }
    }, [productId, variantId, qty, globalItems, setGlobalItems]);


    // Calculate subtotal by computing lineTotal for each item
    const subtotal: number = items.reduce((sum: number, i: OrderItem) => sum + i.unitPrice * i.quantity, 0);
    const shipping: number = 0;  
    // const discount: number = 0; 
    const total: number = subtotal + shipping;

    // Guard: ensure URL has required params only if no global items exist
    if ((!productId || !variantId) && (!globalItems || globalItems.length === 0)) {
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
                    // discount={discount}
                    total={total}
                    onNext={() => {
                        // Ensure sessionKey is included so next pages bind to the same session
                        const qs = new URLSearchParams(searchParams);
                        if (!qs.get("sessionKey")) qs.set("sessionKey", sessionKey as string);
                        navigate(`/order/payment?${qs.toString()}`);
                    }}
                    className="mt-12"
                    showShippingRow={false}
                />
            </div>
        </div>
    );
}
