import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BackHeader } from "@/components/Order/BackHeader";
import { OrderItemsSection } from "@/components/Order/OrderItemsSection";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import type { OrderItem } from "@/components/Order/OrderItemRow";
import { getProductByID } from "@/services/product.services";
import type { Attribute, Product, ProductResponse, Variant } from "@/types/order";
import { useOrderSession } from "../../../../contexts/OrderContext";


export default function OrderConfirm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const qty = Number(searchParams.get("qty") || "1");
    const sessionKey = (searchParams.get("sessionKey") || `order:${productId || "_"}:${variantId || "_"}`) as string;

    const { items: globalItems, setItems: setGlobalItems } = useOrderSession(sessionKey);
    const [items, setItems] = useState<OrderItem[]>([]);

    useEffect(() => {
        if (productId && variantId) {
                // Hydrate the order from product detail params so the confirmation page works standalone.
            (async () => {
                try {
                    const response: ProductResponse = await getProductByID(productId);
                    const product: Product = response.data;
                    const match = product.variants?.find((variant: Variant | any) => {
                        const vid = (variant as any)?.variantId ?? (variant as any)?.id;
                        return String(vid) === String(variantId);
                    });

                    if (!match) {
                        console.error("Variant not found");
                        setItems([]);
                        setGlobalItems([]);
                        return;
                    }

                    const uniqueAttributes: Attribute[] = match.attributes?.filter((attr, idx, arr) => (
                        arr.findIndex((item) => item.attributeName === attr.attributeName && item.attributeValue === attr.attributeValue) === idx
                    )) || [];

                    const hydratedItem: OrderItem = {
                        id: variantId,
                        name: (match as any).variantName ?? (match as any).name ?? "Variant",
                        image: (match as any).imageURL || (match as any).image || "/src/assets/product-placeholder.png",
                        unitPrice: Number(match.price),
                        quantity: qty,
                        attributesText: uniqueAttributes.map((a) => `${a.attributeName}: ${a.attributeValue}`).join(", "),
                    };

                    const nextItems = [hydratedItem];
                    setItems(nextItems);

                    const isSameSelection = Array.isArray(globalItems)
                        && globalItems.length === 1
                        && String(globalItems[0]?.id) === String(variantId)
                        && Number(globalItems[0]?.quantity) === qty
                        && Number(globalItems[0]?.unitPrice) === Number(match.price);

                    if (!isSameSelection) setGlobalItems(nextItems);
                } catch (error) {
                    console.error("Failed to load product", error);
                    setItems([]);
                    setGlobalItems([]);
                }
            })();
            return;
        }

        if (globalItems.length) {
            setItems(globalItems);
        } else {
            setItems([]);
        }
    }, [productId, variantId, qty, globalItems, setGlobalItems]);

    const subtotal = useMemo(() => (
        items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    ), [items]);

    if ((!productId || !variantId) && !globalItems.length) {
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

    const handleNext = () => {
        const params = new URLSearchParams(searchParams);
        if (!params.get("sessionKey")) params.set("sessionKey", sessionKey);
        navigate(`/order/payment?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            <BackHeader title="Product Confirmation" />
            <div className="grid md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-8">
                    <OrderItemsSection items={items} />
                </div>
                <OrderSummaryCard
                    subtotal={subtotal}
                    shipping={0}
                    total={subtotal}
                    onNext={handleNext}
                    className="mt-12"
                    showShippingRow={false}
                />
            </div>
        </div>
    );
}
