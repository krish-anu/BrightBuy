import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed: CartItem[] = JSON.parse(savedCart) || [];
        // Sanitize: drop invalid (NaN) ids and coerce numeric fields
        const cleaned = parsed
          .filter(it => Number.isFinite(Number(it.variantId)) && Number.isFinite(Number(it.productId)))
          .map(it => ({
            ...it,
            variantId: Number(it.variantId),
            productId: Number(it.productId),
            price: Number(it.price),
            quantity: Math.max(1, Number(it.quantity) || 1),
          }));
        setItems(cleaned);
      } catch {
        // Corrupt cart; clear it
        localStorage.removeItem('cart');
        setItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((currentItems) => {
      // Normalize incoming item
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
          Number(item.variantId) === variantId
            ? { ...item, quantity: item.quantity + normalized.quantity }
            : item
        );
      }

      return [...currentItems, normalized];
    });
  };

  const removeItem = (variantId: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.variantId !== variantId)
    );
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};