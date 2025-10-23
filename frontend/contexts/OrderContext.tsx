import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
export type OrderItem = {
  id: string | number | null;
  name: string;
  image: string;
  attributesText: string;
  unitPrice: number;
  quantity: number;
};

export type ShippingChoice = "standard" | "pickup";
export type PaymentChoice = "online" | "cod";

export type OrderSelection = {
  items: OrderItem[];
  shippingMethod: ShippingChoice;
  paymentMethod: PaymentChoice;
  shippingAddressId?: string;
  shippingCost?: number; // computed in Payment page based on address + subtotal
};

type OrderContextValue = {
  orders: Record<string, OrderSelection>;
  setOrders: React.Dispatch<React.SetStateAction<Record<string, OrderSelection>>>;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

const defaultSelection: OrderSelection = {
  items: [],
  shippingMethod: "standard",
  paymentMethod: "online",
  shippingAddressId: undefined,
  shippingCost: 0,
};

const STORAGE_KEY = "bb:order:selections";

export function OrderProvider({ children }: { children: ReactNode }) {
  // Rehydrate from sessionStorage to survive refresh/redirects within the same tab
  const [orders, setOrders] = useState<Record<string, OrderSelection>>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, OrderSelection>;
    } catch {
      // ignore parse errors
    }
    return {};
  });

  // Persist on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // storage may be unavailable; fail silently
    }
  }, [orders]);

  const value = useMemo<OrderContextValue>(() => ({ orders, setOrders }), [orders]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderSession(key: string) {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrderSession must be used within an OrderProvider");
  const current = ctx.orders[key] ?? defaultSelection;

  const setItems = useCallback((items: OrderItem[]) => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), items },
    }));
  }, [ctx.setOrders, key]);

  const setShippingMethod = useCallback((val: ShippingChoice) => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), shippingMethod: val },
    }));
  }, [ctx.setOrders, key]);

  const setPaymentMethod = useCallback((val: PaymentChoice) => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), paymentMethod: val },
    }));
  }, [ctx.setOrders, key]);

  const setShippingAddressId = useCallback((id?: string) => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), shippingAddressId: id },
    }));
  }, [ctx.setOrders, key]);

  const setShippingCost = useCallback((cost?: number) => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), shippingCost: typeof cost === 'number' ? cost : 0 },
    }));
  }, [ctx.setOrders, key]);

  const reset = useCallback(() => {
    ctx.setOrders((prev: Record<string, OrderSelection>) => ({
      ...prev,
      [key]: defaultSelection,
    }));
  }, [ctx.setOrders, key]);

  return {
    ...current,
    setItems,
    setShippingMethod,
    setPaymentMethod,
    setShippingAddressId,
    setShippingCost,
    reset,
  } as const;
}
