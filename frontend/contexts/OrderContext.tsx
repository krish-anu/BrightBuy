import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
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
};

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Record<string, OrderSelection>>({});
  const value = useMemo<OrderContextValue>(() => ({ orders, setOrders }), [orders]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderSession(key: string) {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrderSession must be used within an OrderProvider");
  const current = ctx.orders[key] ?? defaultSelection;

  const setItems = useCallback((items: OrderItem[]) => {
    ctx.setOrders((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), items },
    }));
  }, [ctx.setOrders, key]);

  const setShippingMethod = useCallback((val: ShippingChoice) => {
    ctx.setOrders((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), shippingMethod: val },
    }));
  }, [ctx.setOrders, key]);

  const setPaymentMethod = useCallback((val: PaymentChoice) => {
    ctx.setOrders((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), paymentMethod: val },
    }));
  }, [ctx.setOrders, key]);

  const setShippingAddressId = useCallback((id?: string) => {
    ctx.setOrders((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultSelection), shippingAddressId: id },
    }));
  }, [ctx.setOrders, key]);

  const reset = useCallback(() => {
    ctx.setOrders((prev) => ({
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
    reset,
  } as const;
}
