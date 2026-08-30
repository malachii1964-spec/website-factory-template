"use client";

import * as React from "react";
import {
  type CartItem,
  addToCart,
  cartItemCount,
  cartTotal,
  readCart,
  removeFromCart,
  resolveCartLines,
  updateQty,
  writeCart,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  lines: ReturnType<typeof resolveCartLines>;
  total: number;
  count: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

// Cached snapshot so useSyncExternalStore gets a referentially stable array
// between renders (readCart() re-parses JSON on every call otherwise).
let snapshot: CartItem[] = [];
let snapshotStale = true;

function getSnapshot(): CartItem[] {
  if (snapshotStale) {
    snapshot = readCart();
    snapshotStale = false;
  }
  return snapshot;
}

const EMPTY_CART: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribe(callback: () => void): () => void {
  const onStorage = () => {
    snapshotStale = true;
    callback();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);

  const persist = React.useCallback((next: CartItem[]) => {
    writeCart(next);
    snapshot = next;
    snapshotStale = false;
    forceUpdate();
  }, []);

  const value = React.useMemo<CartContextValue>(() => {
    const lines = resolveCartLines(items);
    return {
      items,
      lines,
      total: cartTotal(lines),
      count: cartItemCount(items),
      add: (slug, qty = 1) => persist(addToCart(items, slug, qty)),
      setQty: (slug, qty) => persist(updateQty(items, slug, qty)),
      remove: (slug) => persist(removeFromCart(items, slug)),
      clear: () => persist([]),
    };
  }, [items, persist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
