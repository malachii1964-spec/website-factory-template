import { describe, it, expect } from "vitest";
import {
  addToCart,
  updateQty,
  removeFromCart,
  resolveCartLines,
  cartTotal,
  cartItemCount,
} from "./cart";
import { products } from "./products";

const item1 = products[0];
const item2 = products[1];

describe("addToCart", () => {
  it("adds a new item with the given quantity", () => {
    const result = addToCart([], item1.slug, 2);
    expect(result).toEqual([{ slug: item1.slug, qty: 2 }]);
  });

  it("increments quantity when the item is already in the cart", () => {
    const result = addToCart([{ slug: item1.slug, qty: 1 }], item1.slug, 2);
    expect(result).toEqual([{ slug: item1.slug, qty: 3 }]);
  });
});

describe("updateQty", () => {
  it("sets the quantity for an existing item", () => {
    const result = updateQty([{ slug: item1.slug, qty: 1 }], item1.slug, 5);
    expect(result).toEqual([{ slug: item1.slug, qty: 5 }]);
  });

  it("removes the item when quantity drops to zero or below", () => {
    const result = updateQty([{ slug: item1.slug, qty: 1 }], item1.slug, 0);
    expect(result).toEqual([]);
  });
});

describe("removeFromCart", () => {
  it("removes only the targeted item", () => {
    const cart = [
      { slug: item1.slug, qty: 1 },
      { slug: item2.slug, qty: 1 },
    ];
    expect(removeFromCart(cart, item1.slug)).toEqual([{ slug: item2.slug, qty: 1 }]);
  });
});

describe("resolveCartLines / cartTotal", () => {
  it("prices every line straight from the live catalog (no drift)", () => {
    const cart = [
      { slug: item1.slug, qty: 2 },
      { slug: item2.slug, qty: 3 },
    ];
    const lines = resolveCartLines(cart);
    expect(lines).toHaveLength(2);
    expect(lines[0].lineTotal).toBeCloseTo(item1.price * 2);
    expect(lines[1].lineTotal).toBeCloseTo(item2.price * 3);
    expect(cartTotal(lines)).toBeCloseTo(item1.price * 2 + item2.price * 3);
  });

  it("silently drops slugs that no longer exist in the catalog", () => {
    const lines = resolveCartLines([{ slug: "retired-product", qty: 1 }]);
    expect(lines).toEqual([]);
    expect(cartTotal(lines)).toBe(0);
  });
});

describe("cartItemCount", () => {
  it("sums quantities across all lines", () => {
    const cart = [
      { slug: item1.slug, qty: 2 },
      { slug: item2.slug, qty: 3 },
    ];
    expect(cartItemCount(cart)).toBe(5);
  });
});
