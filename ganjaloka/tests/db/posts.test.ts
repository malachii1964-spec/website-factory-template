import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { encodeCursor } from "../../src/lib/cursor";
import { anon, cleanupMembers, createMember, expectDbError, newPost, postOf, profileOf, sql } from "./helpers";

afterAll(cleanupMembers);

describe("posts", () => {
  it("creates a post, bumps posts_count, and ignores client-supplied server columns", async () => {
    const a = await createMember();
    const post = await newPost(a);
    expect(post.kind).toBe("post");
    expect((await profileOf(a.id)).posts_count).toBe(1);
  });

  it("refuses to post as someone else", async () => {
    const a = await createMember();
    const b = await createMember();
    expectDbError(await a.client.from("posts").insert({ author_id: b.id, body: "spoof" }), /row-level security|42501/);
  });

  it("refuses writes to counters, kind and removal columns", async () => {
    const a = await createMember();
    expectDbError(
      await a.client.from("posts").insert({ author_id: a.id, body: "x", like_count: 999 } as never),
      "42501",
    );
    const post = await newPost(a);
    expectDbError(await a.client.from("posts").update({ body: "edited" }).eq("id", post.id), "42501");
  });

  it("enforces the 500-character limit and non-empty content", async () => {
    const a = await createMember();
    expectDbError(await a.client.from("posts").insert({ author_id: a.id, body: "x".repeat(501) }), "posts_body_length");
    expectDbError(await a.client.from("posts").insert({ author_id: a.id, body: "   " }), "posts_has_content");
  });

  it("rate-limits bursts (8 posts per minute)", async () => {
    const a = await createMember();
    for (let i = 0; i < 8; i++) await newPost(a, `post ${i}`);
    expectDbError(await a.client.from("posts").insert({ author_id: a.id, body: "one too many" }), "GL_RATE_LIMITED");
  });

  it("only accepts media in the author's own folder, with a well-formed shape", async () => {
    const a = await createMember();
    const b = await createMember();
    const good = { path: `${a.id}/${randomUUID()}.webp`, w: 1200, h: 900, alt: "Purple pheno" };
    expect((await a.client.from("posts").insert({ author_id: a.id, body: "", media: [good] })).error).toBeNull();

    const cases: unknown[] = [
      [{ ...good, path: `${b.id}/${randomUUID()}.webp` }],
      [{ ...good, path: `${a.id}/../../secret.webp` }],
      [{ path: good.path, w: 10 }],
      [{ ...good, w: 0 }],
      [{ ...good, alt: "x".repeat(301) }],
      ["just a string"],
    ];
    for (const media of cases) {
      expectDbError(
        await a.client.from("posts").insert({ author_id: a.id, body: "x", media: media as never }),
        "GL_INVALID_MEDIA",
      );
    }
  });

  it("lets authors delete their own posts only", async () => {
    const a = await createMember();
    const b = await createMember();
    const post = await newPost(a);
    await b.client.from("posts").delete().eq("id", post.id);
    expect(await postOf(post.id)).not.toBeNull();
    await a.client.from("posts").delete().eq("id", post.id);
    expect(await postOf(post.id)).toBeNull();
    expect((await profileOf(a.id)).posts_count).toBe(0);
  });

  it("lets anonymous visitors read but never write", async () => {
    const a = await createMember();
    const post = await newPost(a, "public hello");
    const read = await anon.from("posts").select("id").eq("id", post.id);
    expect(read.data).toHaveLength(1);
    expectDbError(await anon.from("posts").insert({ author_id: a.id, body: "anon" }), /42501|row-level/);
  });
});

describe("replies and reposts", () => {
  it("counts replies and keeps orphaned replies as replies", async () => {
    const a = await createMember();
    const b = await createMember();
    const parent = await newPost(a);
    const reply = await newPost(b, "nice frost", { reply_to_id: parent.id });
    expect(reply.kind).toBe("reply");
    expect((await postOf(parent.id))!.reply_count).toBe(1);

    await a.client.from("posts").delete().eq("id", parent.id);
    const orphan = await postOf(reply.id);
    expect(orphan!.kind).toBe("reply");
    expect(orphan!.reply_to_id).toBeNull();
  });

  it("counts reposts, normalizes repost-of-repost to the original, and allows one per member", async () => {
    const a = await createMember();
    const b = await createMember();
    const c = await createMember();
    const original = await newPost(a);
    const repost = await b.client
      .from("posts")
      .insert({ author_id: b.id, repost_of_id: original.id, body: "ignored" })
      .select("id, kind, body, repost_of_id")
      .single();
    expect(repost.data).toMatchObject({ kind: "repost", body: "", repost_of_id: original.id });

    const viaRepost = await c.client
      .from("posts")
      .insert({ author_id: c.id, repost_of_id: repost.data!.id })
      .select("repost_of_id")
      .single();
    expect(viaRepost.data!.repost_of_id).toBe(original.id);
    expect((await postOf(original.id))!.repost_count).toBe(2);

    expectDbError(await b.client.from("posts").insert({ author_id: b.id, repost_of_id: original.id }), "23505");
  });
});

describe("likes", () => {
  it("counts likes once per member and only as yourself", async () => {
    const a = await createMember();
    const b = await createMember();
    const post = await newPost(a);
    expect((await b.client.from("likes").insert({ member_id: b.id, post_id: post.id })).error).toBeNull();
    expectDbError(await b.client.from("likes").insert({ member_id: b.id, post_id: post.id }), "23505");
    expectDbError(await b.client.from("likes").insert({ member_id: a.id, post_id: post.id }), /row-level|42501/);
    expect((await postOf(post.id))!.like_count).toBe(1);

    await b.client.from("likes").delete().eq("member_id", b.id).eq("post_id", post.id);
    expect((await postOf(post.id))!.like_count).toBe(0);
  });
});

describe("feeds", () => {
  it("home feed = you + who you follow, without replies; keyset pagination is stable", async () => {
    const a = await createMember();
    const b = await createMember();
    const stranger = await createMember();
    await a.client.from("follows").insert({ follower_id: a.id, followee_id: b.id });

    const mine = await newPost(a, "mine");
    const theirs1 = await newPost(b, "theirs 1");
    const theirs2 = await newPost(b, "theirs 2");
    await newPost(b, "a reply", { reply_to_id: mine.id });
    await newPost(stranger, "not followed");

    const page1 = await a.client.rpc("home_feed", { p_limit: 2 });
    expect(page1.data!.map((p) => p.id)).toEqual([theirs2.id, theirs1.id]);

    const last = page1.data!.at(-1)!;
    const page2 = await a.client.rpc("home_feed", { p_limit: 2, p_before_at: last.created_at, p_before_id: last.id });
    expect(page2.data!.map((p) => p.id)).toEqual([mine.id]);
    expect(encodeCursor({ at: last.created_at, id: last.id })).toBeTruthy();
  });

  it("explore shows top-level posts from everyone and hides removed posts", async () => {
    const a = await createMember();
    const post = await newPost(a, "explore me");
    const before = await anon.rpc("explore_feed", { p_limit: 50 });
    expect(before.data!.some((p) => p.id === post.id)).toBe(true);

    await sql`update public.posts set removed_at = now() where id = ${post.id}`;
    const after = await anon.rpc("explore_feed", { p_limit: 50 });
    expect(after.data!.some((p) => p.id === post.id)).toBe(false);
  });

  it("clamps page size to 50", async () => {
    const a = await createMember();
    const result = await a.client.rpc("explore_feed", { p_limit: 10_000 });
    expect(result.data!.length).toBeLessThanOrEqual(50);
  });
});
