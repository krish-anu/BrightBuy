import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { BackHeader } from "@/components/Order/BackHeader";
import { OrderSummaryCard } from "@/components/Order/OrderSummaryCard";
import PaymentMethod from "@/components/Order/PaymentMethod";
import ShippingAddressSection from "@/components/Order/ShippingAddressSection";
import ShippingMethod from "@/components/Order/ShippingMethod";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getUserProfile } from "@/services/user.services";
import { getVariant } from "@/services/variant.services";
import { useOrderSession } from "../../../../contexts/OrderContext";
import { listAddresses } from "@/services/address.services";
import { getAllCities, type City } from "@/services/city.services";
import { computeShippingCharge } from "@/lib/utils";
 

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionKeyParam: string | null = searchParams.get("sessionKey");
  const productId: string | null = searchParams.get("productId");
  const variantId: string | null = searchParams.get("variantId");
  // Restore the session key if it's missing after refresh/redirect within same tab
  const storedKey = (() => {
    try { return sessionStorage.getItem("bb:lastOrderSessionKey"); } catch { return null; }
  })();
  const derivedKey = `order:${productId || "_"}:${variantId || "_"}`;
  // Prefer explicit URL param, then key derived from current params, and only then fall back to stored key
  const sessionKey = sessionKeyParam || derivedKey || storedKey || "order:_:_";

  // Keep last used key in sessionStorage and sync the URL so refreshes stay on the same session
  useEffect(() => {
    try { sessionStorage.setItem("bb:lastOrderSessionKey", sessionKey); } catch {}
    if (!sessionKeyParam) {
      const qs = new URLSearchParams(searchParams);
      qs.set("sessionKey", sessionKey);
      navigate({ pathname: location.pathname, search: `?${qs.toString()}` }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);
  const { shippingMethod, setShippingMethod, paymentMethod, setPaymentMethod, shippingAddressId, setShippingAddressId, items, setShippingCost } = useOrderSession(sessionKey);

  // Determine if any item is out of stock by checking variant stock on the server
  const [hasOutOfStock, setHasOutOfStock] = useState<boolean>(false);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!items?.length) { if (!ignore) setHasOutOfStock(false); return; }
        // Fetch variant details for each item to read stock levels server-side
        const results = await Promise.all(
          items.map(async (it) => {
            const vid = (typeof it.id === "string" && /^\d+$/.test(it.id)) ? Number(it.id) : it.id;
            const resp = await getVariant(vid as any);
            // resp may be null if variant deleted
            const data = resp && (resp as any).data ? (resp as any).data : (resp as any);
            const stock = data?.stockQnt ?? data?.stock ?? 0;
            return Number(stock) <= 0;
          })
        );
        if (!ignore) setHasOutOfStock(results.some(Boolean));
      } catch (e) {
        // If stock check fails, be conservative and do not block; treat as not out of stock
        if (!ignore) setHasOutOfStock(false);
      }
    })();
    return () => { ignore = true; };
  }, [items]);

  // Compute summary values once per items change to avoid repeated work in render
  const subtotal = useMemo(() => (
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  ), [items]);

  // Load addresses and cities to estimate shipping on this page as well
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null); // live selection from child
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try { const rows = await listAddresses(); if (mounted) setAddresses(rows || []); } catch {}
      try { const all = await getAllCities(); if (mounted) setCities(all || []); } catch {}
    })();
    return () => { mounted = false; };
  }, []);
  const selectedAddr = useMemo(() => (
    selectedAddress || addresses.find((a) => String(a.id) === String(shippingAddressId))
  ), [selectedAddress, addresses, shippingAddressId]);
  const isMainCity = useMemo(() => {
    if (!selectedAddr?.cityId) return undefined;
    const city = cities.find((c) => Number(c.id) === Number(selectedAddr.cityId));
    // Use backend field isMainCity (number 0/1)
    return Boolean((city as any)?.isMainCity ?? (city as any)?.isMainCategory);
  }, [cities, selectedAddr]);
  const shipping = useMemo(() => {
    if (shippingMethod !== 'standard') return 0;
    if (!selectedAddr || typeof isMainCity === 'undefined') return 0;
    return computeShippingCharge(Boolean(isMainCity), Number(subtotal.toFixed(2)), 'standard');
  }, [shippingMethod, selectedAddr, isMainCity, subtotal]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  // Persist computed shipping to session context so Summary page can reuse it without recomputing
  useEffect(() => {
    setShippingCost(shipping);
  }, [shipping, setShippingCost]);

  // Auth guard: check protected profile endpoint and redirect to login 
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getUserProfile();
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.response?.status ?? err?.status;
        if (status === 401 || status === 403 || status == 404) {
          navigate("/login", { state: { from: location }, replace: true });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, location]);


  // Guard against invalid direct access or missing session data
  // Consider the session invalid if there are no items.
  // Use a null-safe check in case `items` is undefined/null from the context.
  const isInvalid = !items?.length;
  if (isInvalid) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Invalid order session</h1>
        <p className="text-muted-foreground">Please return to the cart or product page and start checkout again.</p>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackHeader title="Product Confirmation" />
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-8">
          <ShippingMethod value={shippingMethod} onChange={setShippingMethod} />
          <Separator />
          {shippingMethod === "standard" ? (
            // Address picker handles creating/selecting addresses and feeds city info for shipping later steps
            <ShippingAddressSection
              onSelectionChange={(id, addr) => {
                setShippingAddressId(id);
                setSelectedAddress(addr ?? null);
              }}
              initialSelectedId={shippingAddressId}
              shippingMethod={shippingMethod}
              hasOutOfStock={hasOutOfStock}
              showEta={false}
            />
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 border text-sm md:text-base text-muted-foreground">
              You can pick up your order from the store nearest to you.
            </div>
          )}
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

