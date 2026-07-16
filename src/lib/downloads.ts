import { createHmac, timingSafeEqual } from "node:crypto";
import { getProductBySlug } from "@/lib/products";

/**
 * Database-free secure downloads.
 *
 * When someone buys, we email them a link containing a short-lived, HMAC-signed
 * token. The token itself is the authorization — no login, no orders table
 * needed to gate access. Tamper with it or let it expire and it stops working.
 *
 * Files live either in a private bucket (set DOWNLOAD_STORAGE_URL) or a local
 * private directory (DOWNLOADS_DIR). Nothing sellable is ever served publicly.
 */

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return process.env.DOWNLOAD_SECRET || "";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", secret()).update(data).digest());
}

/** Create a signed, expiring download token for a product slug. */
export function createDownloadToken(slug: string, ttlMs = DEFAULT_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const payload = b64url(`${slug}:${exp}`);
  return `${payload}.${sign(payload)}`;
}

/** Verify a token; returns the slug if valid and unexpired, else null. */
export function verifyDownloadToken(token: string): { slug: string } | null {
  if (!secret()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
  } catch {
    return null;
  }
  const sep = decoded.lastIndexOf(":");
  if (sep === -1) return null;
  const slug = decoded.slice(0, sep);
  const exp = Number(decoded.slice(sep + 1));
  if (!slug || !Number.isFinite(exp) || Date.now() > exp) return null;

  return { slug };
}

/** A clean, human filename for the downloaded file. */
export function downloadFileName(slug: string): string {
  const product = getProductBySlug(slug);
  const base = product
    ? product.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")
    : slug;
  return `${base}.pdf`;
}

/** The on-disk / in-bucket object name we look for. */
export function storageKey(slug: string): string {
  return `${slug}.pdf`;
}

/** Build an absolute download URL for a purchased product. */
export function buildDownloadUrl(origin: string, slug: string, ttlMs?: number): string {
  const token = createDownloadToken(slug, ttlMs);
  return `${origin}/api/download?token=${encodeURIComponent(token)}`;
}
