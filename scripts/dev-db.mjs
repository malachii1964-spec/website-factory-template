/**
 * Dev-only database sidecar.
 *
 * Next.js dev runs several worker processes; a file-backed PGlite instance
 * can only be opened by one of them. So exactly one copy of this script owns
 * the embedded database and serves it over the Postgres wire protocol on
 * 127.0.0.1:5522 — every Next worker connects as an ordinary pg client.
 * Spawned automatically from src/instrumentation.ts; if the port is already
 * taken, another worker won the race and this copy just exits.
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = 5522;
const dataDir = path.join(process.cwd(), ".pglite", "dev");

// Claim the port BEFORE touching the data dir: several Next workers can
// spawn this script at once, and PGlite's file-backed store must only ever
// be opened by one process. Losing the port race exits before any file I/O.
const claim = net.createServer();
try {
  await new Promise((resolve, reject) => {
    claim.once("error", reject);
    claim.listen(PORT, "127.0.0.1", resolve);
  });
} catch (err) {
  if (err && err.code === "EADDRINUSE") process.exit(0);
  throw err;
}

const DDL = `
create table if not exists "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "email_verified" boolean not null default false,
  "image" text,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);
create table if not exists "session" (
  "id" text primary key,
  "expires_at" timestamp not null,
  "token" text not null unique,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text not null references "user"("id") on delete cascade
);
create table if not exists "account" (
  "id" text primary key,
  "account_id" text not null,
  "provider_id" text not null,
  "user_id" text not null references "user"("id") on delete cascade,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);
create table if not exists "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expires_at" timestamp not null,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);
create table if not exists "bookmark" (
  "user_id" text not null references "user"("id") on delete cascade,
  "guide_slug" text not null,
  "created_at" timestamp not null default now(),
  primary key ("user_id", "guide_slug")
);
create table if not exists "social_profile" (
  "user_id" text primary key references "user"("id") on delete cascade,
  "handle" text not null unique,
  "bio" text,
  "location" text,
  "banner_url" text,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);
create table if not exists "follow" (
  "follower_id" text not null references "user"("id") on delete cascade,
  "following_id" text not null references "user"("id") on delete cascade,
  "created_at" timestamp not null default now(),
  primary key ("follower_id", "following_id")
);
create table if not exists "post" (
  "id" text primary key,
  "user_id" text not null references "user"("id") on delete cascade,
  "body" text,
  "stage" text,
  "strain_name" text,
  "strain_slug" text,
  "moderation_status" text not null default 'visible',
  "created_at" timestamp not null default now()
);
create table if not exists "post_media" (
  "id" text primary key,
  "post_id" text not null references "post"("id") on delete cascade,
  "kind" text not null,
  "url" text not null,
  "position" integer not null default 0,
  "created_at" timestamp not null default now()
);
create table if not exists "post_report" (
  "post_id" text not null references "post"("id") on delete cascade,
  "reporter_id" text not null references "user"("id") on delete cascade,
  "reason" text not null,
  "created_at" timestamp not null default now(),
  primary key ("post_id", "reporter_id")
);
`;

fs.mkdirSync(dataDir, { recursive: true });
const db = await PGlite.create(dataDir);
await db.exec(DDL);

// Hand the claimed port over to the real server. The instant between close
// and start only races against processes that already lost the claim above.
await new Promise((resolve) => claim.close(resolve));
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });

try {
  await server.start();
  console.log(`[dev-db] embedded Postgres ready on 127.0.0.1:${PORT}`);
} catch (err) {
  await db.close().catch(() => {}); // never leave the data dir open on loss
  if (err && (err.code === "EADDRINUSE" || String(err).includes("EADDRINUSE"))) {
    process.exit(0); // another worker already runs the sidecar
  }
  throw err;
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await server.stop().catch(() => {});
    await db.close().catch(() => {});
    process.exit(0);
  });
}
