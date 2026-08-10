import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Better Auth core tables — shape must match what the drizzle adapter expects.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Site tables
export const bookmark = pgTable(
  "bookmark",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    guideSlug: text("guide_slug").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.guideSlug] })],
);

/**
 * A grow journal started from one of the "Grow Like the Greats" methods.
 *
 * The schedule itself is NOT stored — it is derived from the method module
 * (e.g. canucks-method.ts) plus potGallons/plants/startedOn, so improving a
 * method's data improves every existing journal instead of leaving old rows
 * frozen at whatever the schedule said the day they were created. Only the
 * inputs and the completions are persisted.
 */
export const grow = pgTable("grow", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Which method this journal follows, e.g. "mr-canucks-grow". */
  methodSlug: text("method_slug").notNull(),
  name: text("name").notNull(),
  potGallons: integer("pot_gallons").notNull(),
  plants: integer("plants").notNull(),
  /** Date the grower potted up — day the schedule counts from. */
  startedOn: timestamp("started_on").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** One row per completed schedule event. Absence means "not done yet". */
export const growEventDone = pgTable(
  "grow_event_done",
  {
    growId: text("grow_id")
      .notNull()
      .references(() => grow.id, { onDelete: "cascade" }),
    /** MethodEvent.id from the method module. */
    eventId: text("event_id").notNull(),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.growId, t.eventId] })],
);
