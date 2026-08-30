import { getProductBySlug } from "@/lib/products";

export interface CartItem {
  slug: string;
  qty: number;
}

export interface CartLine extends CartItem {
  title: string;
  price: number;
  unit: string;
  lineTotal: number;
}

const STORAGE_KEY = "ironroots.cart.v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).slug === "string" &&
        typeof (i as CartItem).qty === "number" &&
        (i as CartItem).qty > 0,
    );
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(items: CartItem[], slug: string, qty = 1): CartItem[] {
  const existing = items.find((i) => i.slug === slug);
  if (existing) {
    return items.map((i) =>
      i.slug === slug ? { ...i, qty: i.qty + qty } : i,
    );
  }
  return [...items, { slug, qty }];
}

export function updateQty(items: CartItem[], slug: string, qty: number): CartItem[] {
  if (qty <= 0) return items.filter((i) => i.slug !== slug);
  return items.map((i) => (i.slug === slug ? { ...i, qty } : i));
}

export function removeFromCart(items: CartItem[], slug: string): CartItem[] {
  return items.filter((i) => i.slug !== slug);
}

/** Resolves cart items against the live catalog, dropping any unknown/retired slugs. */
export function resolveCartLines(items: CartItem[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = getProductBySlug(item.slug);
    if (!product) continue;
    lines.push({
      slug: item.slug,
      qty: item.qty,
      title: product.title,
      price: product.price,
      unit: product.unit,
      lineTotal: Math.round(product.price * item.qty * 100) / 100,
    });
  }
  return lines;
}

export function cartTotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
