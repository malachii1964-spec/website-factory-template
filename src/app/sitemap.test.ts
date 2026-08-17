import { describe, it, expect } from "vitest";
import sitemap, { SITE_URL } from "./sitemap";
import robots from "./robots";
import { products } from "@/lib/products";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists every product detail page exactly once", () => {
    for (const product of products) {
      const url = `${SITE_URL}/products/${product.slug}`;
      expect(urls.filter((u) => u === url)).toHaveLength(1);
    }
  });

  it("contains no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("uses absolute https URLs on the canonical host", () => {
    for (const url of urls) {
      expect(url.startsWith(`${SITE_URL}/`) || url === SITE_URL).toBe(true);
      expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("excludes transactional and machine routes", () => {
    // These are disallowed in robots.ts; advertising them in the sitemap would
    // send crawlers exactly where we just told them not to go.
    expect(urls.some((u) => u.includes("/checkout/"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
  });

  it("keeps priority within the valid 0..1 range", () => {
    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });
});

describe("robots", () => {
  const config = robots();
  const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;

  it("allows general crawling of the site root", () => {
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
  });

  it("disallows the transactional and machine routes", () => {
    expect(rule.disallow).toContain("/api/");
    expect(rule.disallow).toContain("/checkout/");
  });

  it("points at the sitemap the app actually serves", () => {
    expect(config.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("does not block the whole site", () => {
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    expect(disallow).not.toContain("/");
  });
});
