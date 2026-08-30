import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/schema";

/**
 * Accounts are database-optional, like everything else here: `auth` is null
 * until DATABASE_URL is set, and /api/auth/[...all] returns a friendly
 * "not configured" response instead of crashing when it is.
 */
export const auth = db
  ? betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
      }),
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
      },
      baseURL: process.env.NEXT_PUBLIC_SITE_URL,
      secret: process.env.BETTER_AUTH_SECRET,
    })
  : null;
