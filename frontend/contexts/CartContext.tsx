import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  listCart as apiListCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  clearCart as apiClearCart,
  updateCartSelected as apiUpdateCartSelected,
} from '@/services/cart.services';

export interface CartItem {
  variantId: number;
  productId: number;
  quantity: number;
  name: string;
  color?: string;
  size?: string;
  price: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemsCount: number;
  refresh: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  // Use auth reactively — CartProvider expects AuthProvider to be mounted above it in App.
  // For safety, wrap useAuth in try/catch so unit tests or isolated usage still work.
  let maybeAuth: any = null;
  try {
    maybeAuth = useAuth();
  } catch (e) {
    maybeAuth = null;
  }
  const isAuthenticatedFn = () => (maybeAuth ? maybeAuth.isAuthenticated() : false);

  // Helper to map server cart rows to CartItem shape used in context
  const mapServerRow = (r: any): CartItem => ({
    variantId: Number(r.variantId),
    productId: Number(r.productId ?? 0),
    quantity: Number(r.quantity || 1),
    // prefer variant name if present otherwise product name
    name: r.variantName || r.productName || '',
    price: Number(r.unitPrice ?? r.variantPrice ?? 0),
    imageUrl: r.imageUrl || r.imageURL || undefined,
  });

  // helper to parse concatenated attributes string from server
  const parseAttributes = (attrStr: string | undefined) => {
    const result: Record<string, string> = {};
    if (!attrStr) return result;
    // server returns like: "Color::Red||Size::M"
    try {
      attrStr.split('||').forEach((pair) => {
        const [k, v] = pair.split('::');
        if (k && v) result[k] = v;
      });
    } catch {
      // ignore parsing errors
    }
    return result;
  };

    // Load cart behavior: when authenticated, fetch/merge server cart; when not authenticated, show empty cart
    useEffect(() => {
    // Wait for auth to hydrate to avoid clearing cart prematurely on page refresh
    if (maybeAuth && maybeAuth.authReady === false) {
      return;
    }

    let ignore = false;

    const fetchServer = async () => {
      try {
        const rows = await apiListCart();
        if (ignore) return;
        if (Array.isArray(rows)) {
          setItems(
            rows.map((r: any) => {
              const base = mapServerRow(r);
              const attrs = parseAttributes(r.attributes);
              return {
                ...base,
                color: attrs.Color || attrs.color || undefined,
                size: attrs.Size || attrs.size || undefined,
              } as CartItem;
            })
          );
          return;
        }
      } catch (e) {
        console.warn('Failed to load server cart', e);
        // On server fetch failure, leave cart empty to avoid leaking other user's data
        setItems([]);
      }
    };

    // If authenticated, optionally merge any existing local guest cart into server then fetch server cart
    if (isAuthenticatedFn()) {
      const tryMergeAndFetch = async () => {
        try {
          const raw = localStorage.getItem('cart');
          if (raw) {
            try {
              const parsed: CartItem[] = JSON.parse(raw) || [];
              const cleaned = parsed
                .filter(it => Number.isFinite(Number(it.variantId)) && Number.isFinite(Number(it.productId)))
                .map(it => ({
                  ...it,
                  variantId: Number(it.variantId),
                  productId: Number(it.productId),
                  price: Number(it.price),
                  quantity: Math.max(1, Number(it.quantity) || 1),
                }));

              if (cleaned.length) {
                await Promise.all(
                  cleaned.map((it) =>
                    apiAddToCart({ variantId: it.variantId, quantity: it.quantity, unitPrice: it.price }).catch((e) => {
                      console.warn('[cart] failed to merge item to server', it, e);
                      return null;
                    })
                  )
                );
                localStorage.removeItem('cart');
              }
            } catch (e) {
              console.warn('[cart] failed to parse local cart during merge, clearing local cart', e);
              localStorage.removeItem('cart');
            }
          }

          await fetchServer();
        } catch (e) {
          console.warn('Failed to merge/fetch server cart, leaving cart empty', e);
          setItems([]);
        }
      };

      void tryMergeAndFetch();
    } else {
      // Not authenticated: ensure cart is empty and do not load any previous user's items
      try { localStorage.removeItem('cart'); } catch {}
      setItems([]);
    }

    return () => { ignore = true };
  // Re-run when authentication status (user) or auth readiness changes
  }, [maybeAuth?.user, maybeAuth?.authReady]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    // Always update optimistic local state immediately
    setItems((currentItems) => {
      const variantId = Number(newItem.variantId);
      const productId = Number(newItem.productId);
      const price = Number(newItem.price);
      const quantity = Math.max(1, Number(newItem.quantity) || 1);
      if (!Number.isFinite(variantId) || !Number.isFinite(productId)) {
        console.warn('[cart] Ignoring addItem with invalid ids', newItem);
        return currentItems;
      }
      const normalized: CartItem = { ...newItem, variantId, productId, price, quantity };
      const existingItem = currentItems.find((item) => Number(item.variantId) === variantId);
      if (existingItem) {
        return currentItems.map((item) =>
          Number(item.variantId) === variantId ? { ...item, quantity: item.quantity + normalized.quantity } : item
        );
      }
      return [...currentItems, normalized];
    });

    // Persist to server when authenticated
    if (isAuthenticatedFn()) {
      console.log('[cart] persisting addToCart to server for variantId=', newItem.variantId, 'qty=', newItem.quantity);
      void apiAddToCart({ variantId: newItem.variantId, quantity: newItem.quantity, unitPrice: newItem.price })
        .then(() => {
          // Refresh from server so quantities and selections are exact
          refresh();
          // Cross-tab sync signal
          try { localStorage.setItem('cart_sync', String(Date.now())); } catch {}
        })
        .catch((e) => {
          console.warn('Failed to persist addToCart to server:', e);
        });
    }
  };

  const removeItem = (variantId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.variantId !== variantId));
    if (isAuthenticatedFn()) {
      // best-effort: find server-side cart id by variantId is not available here, skip unless frontend stores server id
      // fallback: refetch server cart to align
      void apiListCart()
        .then((rows) => {
          setItems((rows || []).map(mapServerRow));
          try { localStorage.setItem('cart_sync', String(Date.now())); } catch {}
        })
        .catch((e) => console.warn('Failed to refresh server cart after remove', e));
    }
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    setItems((currentItems) => currentItems.map((item) => (item.variantId === variantId ? { ...item, quantity } : item)));
    if (isAuthenticatedFn()) {
      // Resolve server id for variantId
      void apiListCart()
        .then((rows) => {
          const row = (rows || []).find((r: any) => Number(r.variantId) === Number(variantId));
          if (row && row.id) {
            return apiUpdateCartQuantity(row.id, quantity)
              .then((res) => {
                setItems((res.data || []).map(mapServerRow));
                try { localStorage.setItem('cart_sync', String(Date.now())); } catch {}
              })
              .catch(() => {});
          }
        })
        .catch((e) => console.warn('Failed to update quantity on server', e));
    }
  };

  const clearCart = () => {
    setItems([]);
    if (isAuthenticatedFn()) {
      void apiClearCart()
        .then(() => {
          // Cross-tab sync signal
          try { localStorage.setItem('cart_sync', String(Date.now())); } catch {}
        })
        .catch((e) => console.warn('Failed to clear server cart', e));
    }
  };

  const updateSelected = (variantId: number, selected: boolean) => {
    setItems((currentItems) => currentItems.map((item) => (item.variantId === variantId ? { ...item, selected: selected } : item)));
  if (isAuthenticatedFn()) {
      void apiListCart()
        .then((rows) => {
          const row = (rows || []).find((r: any) => Number(r.variantId) === Number(variantId));
          if (row && row.id) {
            return apiUpdateCartSelected(row.id, !!selected).catch(() => {});
          }
        })
        .catch((e) => console.warn('Failed to update selected on server', e));
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Number of displayed variants (distinct rows), not the sum of quantities
  const itemsCount = items.filter(it => Number.isFinite(Number(it.variantId))).length;

  // Listen for cross-tab cart updates and refresh
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart_sync') {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Expose a refresh method to reload from server (or clear if not authenticated)
  const refresh = () => {
    if (maybeAuth && maybeAuth.authReady === false) return;
    if (isAuthenticatedFn()) {
      void apiListCart()
        .then((rows) => {
          const mapped = (rows || []).map((r: any) => {
            const base = mapServerRow(r);
            const attrs = parseAttributes(r.attributes);
            return {
              ...base,
              color: attrs.Color || attrs.color || undefined,
              size: attrs.Size || attrs.size || undefined,
            } as CartItem;
          });
          setItems(mapped);
        })
        .catch((e) => {
          console.warn('[cart] refresh failed, leaving items as-is', e);
        });
    } else {
      try { localStorage.removeItem('cart'); } catch {}
      setItems([]);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        // expose updateSelected for selection toggles
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        updateSelected,
        clearCart,
        total,
        itemsCount,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};