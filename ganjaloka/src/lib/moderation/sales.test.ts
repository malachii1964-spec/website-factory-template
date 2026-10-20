import { describe, expect, it } from "vitest";
import { looksLikeSaleSolicitation } from "./sales";

describe("looksLikeSaleSolicitation — blocks offers", () => {
  it.each([
    "Zaza for sale, hit me up",
    "WTS carts, 2 for 50",
    "now selling exotics in Brooklyn",
    "DM for prices",
    "menu in bio 🔥",
    "Prices in my DMs",
    "hmu to cop",
    "We deliver all over the city",
    "Delivery available tonight",
    "discreet shipping nationwide",
    "CashApp only",
    "accepting zelle and venmo",
    "I'm your plug",
    "ur new plug is here",
    "oz for $120, text me",
    "In stock: eighths $35",
    "Telegram me for the menu",
  ])("blocks %j", (text) => {
    expect(looksLikeSaleSolicitation(text)).toBe(true);
  });
});

describe("looksLikeSaleSolicitation — allows normal conversation", () => {
  it.each([
    "I paid $40 for an eighth at the dispensary today",
    "My local spot sold out of gas again",
    "I'm selling my old grow tent if anyone in Queens wants it",
    "DM me for the recipe, it's my grandma's",
    "Week 7 of flower, the trichomes are going milky",
    "Prices at dispensaries are wild this year",
    "What's the best way to ship a birthday gift?",
    "Shipping my kid off to college this week",
    "Who's your favorite breeder?",
    "Harvest day! Drying these buds slow and low",
  ])("allows %j", (text) => {
    expect(looksLikeSaleSolicitation(text)).toBe(false);
  });
});
