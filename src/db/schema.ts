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

// --- Community (Phase 1: grow-update feed + strain passport) ---
// Deliberately separate from `grow`/`grow_event_done` above (the "Grow Like
// the Greats" method-schedule tracker) — this is a free-form social feed,
// not a schedule. A post may exist with no linked grow journal at all.

export const socialProfile = pgTable("social_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  bio: text("bio"),
  location: text("location"),
  bannerUrl: text("banner_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const follow = pgTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

/**
 * A grow-update post. `stage` is a StageId from stages.ts (nullable — not
 * every post is stage-specific). `strainSlug` links to a curated STRAINS
 * entry when the tagged strain has one; `strainName` is always the display
 * text (curated or free text) so tagging works for strains outside the
 * curated set too.
 */
export const post = pgTable("post", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body"),
  stage: text("stage"),
  strainName: text("strain_name"),
  strainSlug: text("strain_slug"),
  /** "visible" | "hidden_pending_review" | "removed" — see moderation.ts. */
  moderationStatus: text("moderation_status").notNull().default("visible"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postMedia = pgTable("post_media", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // "photo" | "video"
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** One report per (post, reporter) — a user can't inflate the count by reporting twice. */
export const postReport = pgTable(
  "post_report",
  {
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.reporterId] })],
);
