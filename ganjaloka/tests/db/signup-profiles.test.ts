import { afterAll, describe, expect, it } from "vitest";
import { RESERVED_USERNAMES, TERMS_VERSION } from "../../src/lib/validation";
import {
  AUTH_URL,
  PUBLISHABLE_KEY,
  cleanupMembers,
  createMember,
  expectDbError,
  profileOf,
  sql,
  uniqueTag,
} from "./helpers";

afterAll(cleanupMembers);

// Calls the public sign-up endpoint directly (what any client could do). Raw
// fetch, because supabase-js's API-version header makes Auth replace trigger
// messages with a generic "Database error saving new user".
async function signUpRaw(meta: Record<string, unknown>) {
  const tag = uniqueTag();
  const res = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: { apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `raw_${tag}@test.ganjaloka.dev`,
      password: "testpass1234",
      data: { username: `r_${tag}`, birth_date: "1990-01-01", terms_version: TERMS_VERSION, ...meta },
    }),
  });
  const body = (await res.json()) as { code?: string | number; message?: string; msg?: string };
  return res.ok
    ? { error: null }
    : { error: { code: String(body.code ?? res.status), message: body.message ?? body.msg ?? "" } };
}

describe("sign-up trigger (21+ is enforced by the database)", () => {
  it("rejects anyone under 21, even when the app is bypassed", async () => {
    const tooYoung = new Date();
    tooYoung.setUTCFullYear(tooYoung.getUTCFullYear() - 20);
    const result = await signUpRaw({ birth_date: tooYoung.toISOString().slice(0, 10) });
    expectDbError(result, "GL_UNDER_21");
  });

  it("rejects missing birth dates and missing terms acceptance", async () => {
    expectDbError(await signUpRaw({ birth_date: null }), "GL_INVALID_BIRTH_DATE");
    expectDbError(await signUpRaw({ birth_date: "not a date" }), "GL_INVALID_BIRTH_DATE");
    expectDbError(await signUpRaw({ terms_version: "" }), "GL_TERMS_REQUIRED");
  });

  it("rejects every reserved username the app knows about (TS and SQL lists agree)", async () => {
    for (const name of RESERVED_USERNAMES) {
      expectDbError(await signUpRaw({ username: name }), "GL_INVALID_USERNAME");
    }
  });

  it("rejects taken usernames", async () => {
    const first = await createMember();
    expectDbError(await signUpRaw({ username: first.username.toUpperCase() }), "GL_USERNAME_TAKEN");
  });

  it("creates the profile and keeps the birth date out of user metadata and JWTs", async () => {
    const member = await createMember({ birthDate: "1988-07-04" });
    const profile = await profileOf(member.id);
    expect(profile.username).toBe(member.username);
    expect(profile.role).toBe("member");

    const [stored] = await sql`select raw_user_meta_data from auth.users where id = ${member.id}`;
    expect(stored!.raw_user_meta_data).not.toHaveProperty("birth_date");
    expect(stored!.raw_user_meta_data).not.toHaveProperty("terms_version");

    const { data } = await member.client.auth.getClaims();
    expect(JSON.stringify(data?.claims)).not.toContain("1988-07-04");

    const [attestation] = await sql`select birth_date::text as birth_date, terms_version
      from private.member_attestations where user_id = ${member.id}`;
    expect(attestation).toEqual({ birth_date: "1988-07-04", terms_version: TERMS_VERSION });
  });

  it("strips attestation keys if a member tries to write them back", async () => {
    const member = await createMember();
    await member.client.auth.updateUser({ data: { birth_date: "2010-01-01" } });
    const [stored] = await sql`select raw_user_meta_data from auth.users where id = ${member.id}`;
    expect(stored!.raw_user_meta_data).not.toHaveProperty("birth_date");
  });
});

describe("profiles RLS + column grants", () => {
  it("lets a member edit their own display name and bio", async () => {
    const a = await createMember();
    const result = await a.client.from("profiles").update({ display_name: "Night Grower", bio: "Week 7." }).eq("id", a.id);
    expect(result.error).toBeNull();
    expect((await profileOf(a.id)).display_name).toBe("Night Grower");
  });

  it("silently refuses to edit someone else's profile", async () => {
    const a = await createMember();
    const b = await createMember();
    await a.client.from("profiles").update({ display_name: "hacked" }).eq("id", b.id);
    expect((await profileOf(b.id)).display_name).not.toBe("hacked");
  });

  it("forbids members from promoting themselves or editing counters", async () => {
    const a = await createMember();
    expectDbError(await a.client.from("profiles").update({ role: "admin" }).eq("id", a.id), "42501");
    expectDbError(await a.client.from("profiles").update({ followers_count: 1_000_000 }).eq("id", a.id), "42501");
    expectDbError(await a.client.from("profiles").update({ suspended_at: null }).eq("id", a.id), "42501");
    expect((await profileOf(a.id)).role).toBe("member");
  });

  it("only allows avatars inside the member's own storage folder", async () => {
    const a = await createMember();
    const b = await createMember();
    expectDbError(
      await a.client.from("profiles").update({ avatar_path: `${b.id}/avatar-1.webp` }).eq("id", a.id),
      "profiles_avatar_in_own_folder",
    );
  });

  it("forbids direct profile inserts", async () => {
    const a = await createMember();
    expectDbError(
      await a.client.from("profiles").insert({ id: a.id, username: "sneaky_insert", display_name: "x" }),
      /42501|permission/,
    );
  });
});
