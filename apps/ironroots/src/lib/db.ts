import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/lib/schema";

/**
 * Database-optional by design: accounts, orders, and CSA subscriptions all
 * need Postgres, but the site (shop, cart, checkout) does not. `db` is null
 * until DATABASE_URL is set, so build/dev work with zero external services;
 * account-dependent routes check `db` and return a friendly "not configured"
 * response instead of crashing.
 */
const DATABASE_URL = process.env.DATABASE_URL;

export const db = DATABASE_URL ? drizzle(neon(DATABASE_URL), { schema }) : null;
