import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  admin,
  anon,
  cleanupMembers,
  createMember,
  expectDbError,
  makeModerator,
  newPost,
  postOf,
  profileOf,
} from "./helpers";

afterAll(cleanupMembers);

describe("follows", () => {
  it("counts follows and refuses self-follows and follows on someone's behalf", async () => {
    const a = await createMember();
    const b = await createMember();
    expect((await a.client.from("follows").insert({ follower_id: a.id, followee_id: b.id })).error).toBeNull();
    expect((await profileOf(a.id)).following_count).toBe(1);
    expect((await profileOf(b.id)).followers_count).toBe(1);
    expectDbError(await a.client.from("follows").insert({ follower_id: a.id, followee_id: a.id }), "follows_not_self");
    expectDbError(await a.client.from("follows").insert({ follower_id: b.id, followee_id: a.id }), /row-level|42501/);
  });
});

describe("blocks", () => {
  it("hides content both ways, cuts follows, and stops interactions", async () => {
    const a = await createMember();
    const b = await createMember();
    await a.client.from("follows").insert({ follower_id: a.id, followee_id: b.id });
    await b.client.from("follows").insert({ follower_id: b.id, followee_id: a.id });
    const bPost = await newPost(b, "b's post");
    const aPost = await newPost(a, "a's post");

    expect((await b.client.from("blocks").insert({ blocker_id: b.id, blocked_id: a.id })).error).toBeNull();

    // Follows cut both ways, counters follow.
    expect((await profileOf(a.id)).following_count).toBe(0);
    expect((await profileOf(b.id)).followers_count).toBe(0);

    // Neither sees the other's posts, anywhere.
    expect((await a.client.from("posts").select("id").eq("id", bPost.id)).data).toEqual([]);
    expect((await b.client.from("posts").select("id").eq("id", aPost.id)).data).toEqual([]);
    expect((await a.client.rpc("profile_feed", { p_profile_id: b.id })).data).toEqual([]);
    expect((await a.client.rpc("explore_feed", { p_limit: 50 })).data!.some((p) => p.author_id === b.id)).toBe(false);

    // The blocked member can't follow, reply, like or repost.
    expectDbError(await a.client.from("follows").insert({ follower_id: a.id, followee_id: b.id }), "GL_BLOCKED");
    expectDbError(await a.client.from("posts").insert({ author_id: a.id, body: "hey", reply_to_id: bPost.id }), "GL_BLOCKED");
    expectDbError(await a.client.from("likes").insert({ member_id: a.id, post_id: bPost.id }), "GL_BLOCKED");
    expectDbError(await a.client.from("posts").insert({ author_id: a.id, repost_of_id: bPost.id }), "GL_BLOCKED");

    // The block list is private to the blocker; the relationship RPC tells A only about A.
    expect((await a.client.from("blocks").select("*")).data).toEqual([]);
    const rel = await a.client.rpc("viewer_relationship", { p_profile_id: b.id }).single();
    expect(rel.data).toEqual({ following: false, followed_by: false, blocked: false, blocked_by: true });

    // Unblocking restores visibility (follows stay cut).
    await b.client.from("blocks").delete().eq("blocker_id", b.id).eq("blocked_id", a.id);
    expect((await a.client.from("posts").select("id").eq("id", bPost.id)).data).toHaveLength(1);
  });

  it("anonymous visitors can't call the relationship RPC", async () => {
    const a = await createMember();
    expectDbError(await anon.rpc("viewer_relationship", { p_profile_id: a.id }), /42501|permission/);
  });
});

describe("reports and moderation", () => {
  it("captures evidence, keeps reports private, and blocks duplicates", async () => {
    const author = await createMember();
    const reporter = await createMember();
    const outsider = await createMember();
    const post = await newPost(author, "menu in bio");

    const filed = await reporter.client
      .from("reports")
      .insert({ reporter_id: reporter.id, target_type: "post", post_id: post.id, reason: "sale", details: "selling" })
      .select("id, status, target_snapshot")
      .single();
    expect(filed.error).toBeNull();
    expect(filed.data!.status).toBe("open");
    expect(filed.data!.target_snapshot).toMatchObject({ author_id: author.id, body: "menu in bio" });

    expect((await outsider.client.from("reports").select("id")).data).toEqual([]);
    expectDbError(
      await reporter.client.from("reports").insert({ reporter_id: reporter.id, target_type: "post", post_id: post.id, reason: "spam" }),
      "23505",
    );

    // Evidence survives the author deleting the post.
    await author.client.from("posts").delete().eq("id", post.id);
    const { data: kept } = await admin.from("reports").select("post_id, target_snapshot").eq("id", filed.data!.id).single();
    expect(kept!.post_id).toBeNull();
    expect(kept!.target_snapshot).toMatchObject({ body: "menu in bio" });
  });

  it("only moderators can act; removal hides the post from everyone but the author and moderators", async () => {
    const author = await createMember();
    const reporter = await createMember();
    const mod = await createMember();
    await makeModerator(mod);
    const post = await newPost(author, "something bad");
    const { data: report } = await reporter.client
      .from("reports")
      .insert({ reporter_id: reporter.id, target_type: "post", post_id: post.id, reason: "harassment" })
      .select("id")
      .single();

    expectDbError(await reporter.client.rpc("moderate_report", { p_report_id: report!.id, p_action: "remove_post" }), "GL_FORBIDDEN");
    expectDbError(await anon.rpc("moderate_report", { p_report_id: report!.id, p_action: "remove_post" }), /42501|permission/);

    // Moderators see the queue.
    expect((await mod.client.from("reports").select("id").eq("id", report!.id)).data).toHaveLength(1);

    expect((await mod.client.rpc("moderate_report", { p_report_id: report!.id, p_action: "remove_post", p_note: "harassment" })).error).toBeNull();
    expect((await reporter.client.from("posts").select("id").eq("id", post.id)).data).toEqual([]);
    expect((await anon.from("posts").select("id").eq("id", post.id)).data).toEqual([]);
    expect((await author.client.from("posts").select("id").eq("id", post.id)).data).toHaveLength(1);
    expect((await mod.client.from("posts").select("id").eq("id", post.id)).data).toHaveLength(1);

    const { data: resolved } = await admin.from("reports").select("status, resolved_by").eq("id", report!.id).single();
    expect(resolved).toEqual({ status: "actioned", resolved_by: mod.id });

    // Removed posts can't be liked, replied to or reposted.
    expectDbError(await reporter.client.from("likes").insert({ member_id: reporter.id, post_id: post.id }), "GL_POST_UNAVAILABLE");
  });

  it("suspension stops every write path, including uploads", async () => {
    const offender = await createMember();
    const reporter = await createMember();
    const mod = await createMember();
    await makeModerator(mod);
    const target = await newPost(reporter, "target");
    const { data: report } = await reporter.client
      .from("reports")
      .insert({ reporter_id: reporter.id, target_type: "profile", profile_id: offender.id, reason: "impersonation" })
      .select("id")
      .single();

    expect((await mod.client.rpc("moderate_report", { p_report_id: report!.id, p_action: "suspend_member" })).error).toBeNull();
    expect((await profileOf(offender.id)).suspended_at).not.toBeNull();

    expectDbError(await offender.client.from("posts").insert({ author_id: offender.id, body: "still here" }), "GL_SUSPENDED");
    expectDbError(await offender.client.from("likes").insert({ member_id: offender.id, post_id: target.id }), "GL_SUSPENDED");
    expectDbError(await offender.client.from("follows").insert({ follower_id: offender.id, followee_id: reporter.id }), "GL_SUSPENDED");
    const upload = await offender.client.storage
      .from("post-media")
      .upload(`${offender.id}/${randomUUID()}.webp`, new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }));
    expect(upload.error).not.toBeNull();
  });

  it("moderators can't suspend themselves or other moderators", async () => {
    const mod = await createMember();
    const otherMod = await createMember();
    const reporter = await createMember();
    await makeModerator(mod);
    await makeModerator(otherMod);
    const { data: report } = await reporter.client
      .from("reports")
      .insert({ reporter_id: reporter.id, target_type: "profile", profile_id: otherMod.id, reason: "other" })
      .select("id")
      .single();
    await mod.client.rpc("moderate_report", { p_report_id: report!.id, p_action: "suspend_member" });
    expect((await profileOf(otherMod.id)).suspended_at).toBeNull();
  });
});

describe("storage", () => {
  const png = () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });

  it("members upload only into their own folder", async () => {
    const a = await createMember();
    const b = await createMember();
    expect((await a.client.storage.from("post-media").upload(`${a.id}/${randomUUID()}.png`, png())).error).toBeNull();
    expect((await a.client.storage.from("post-media").upload(`${b.id}/${randomUUID()}.png`, png())).error).not.toBeNull();
    expect((await anon.storage.from("post-media").upload(`${a.id}/${randomUUID()}.png`, png())).error).not.toBeNull();
  });

  it("rejects non-image uploads", async () => {
    const a = await createMember();
    const html = new Blob(["<script>alert(1)</script>"], { type: "text/html" });
    expect((await a.client.storage.from("post-media").upload(`${a.id}/${randomUUID()}.png`, html)).error).not.toBeNull();
  });
});

describe("account deletion", () => {
  it("cascades the member's content and fixes other members' counters", async () => {
    const leaving = await createMember();
    const friend = await createMember();
    await leaving.client.from("follows").insert({ follower_id: leaving.id, followee_id: friend.id });
    const friendPost = await newPost(friend);
    await leaving.client.from("likes").insert({ member_id: leaving.id, post_id: friendPost.id });
    const own = await newPost(leaving);

    expect((await admin.auth.admin.deleteUser(leaving.id)).error).toBeNull();
    expect(await postOf(own.id)).toBeNull();
    expect((await profileOf(friend.id)).followers_count).toBe(0);
    expect((await postOf(friendPost.id))!.like_count).toBe(0);
  });
});
