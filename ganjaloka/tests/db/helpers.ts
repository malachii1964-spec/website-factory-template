import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";
import type { Database } from "../../src/lib/supabase/database.types";
import { TERMS_VERSION } from "../../src/lib/validation";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
// Keys come from .env.local (loaded by vitest.db.config.ts); see .env.example.
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
if (!PUBLISHABLE || !SECRET) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local (see .env.example).");
}
const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

if (!/127\.0\.0\.1|localhost/.test(URL) || !/127\.0\.0\.1|localhost/.test(DB_URL)) {
  throw new Error("DB tests create and delete users — they only run against a local Supabase.");
}

export const AUTH_URL = `${URL}/auth/v1`;
export const PUBLISHABLE_KEY = PUBLISHABLE;

export type Client = SupabaseClient<Database>;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin: Client = createClient<Database>(URL, SECRET, options);
export const anon: Client = createClient<Database>(URL, PUBLISHABLE, options);
export const sql = postgres(DB_URL, { max: 2, onnotice: () => {} });

export type Member = { id: string; username: string; email: string; client: Client };

let counter = 0;
const created: string[] = [];

export function uniqueTag(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`.slice(-12);
}

export async function createMember(overrides: { birthDate?: string } = {}): Promise<Member> {
  const tag = uniqueTag();
  const email = `m_${tag}@test.ganjaloka.dev`;
  const password = "testpass1234";
  const username = `t_${tag}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: `Tester ${tag}`,
      birth_date: overrides.birthDate ?? "1990-04-20",
      terms_version: TERMS_VERSION,
    },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  created.push(data.user.id);

  const client = createClient<Database>(URL, PUBLISHABLE, options);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, username, email, client };
}

export async function makeModerator(member: Member): Promise<void> {
  await sql`update public.profiles set role = 'moderator' where id = ${member.id}`;
}

export async function cleanupMembers(): Promise<void> {
  while (created.length > 0) {
    const id = created.pop()!;
    await admin.auth.admin.deleteUser(id);
  }
}

export async function profileOf(id: string) {
  const { data } = await admin.from("profiles").select("*").eq("id", id).single();
  return data!;
}

export async function postOf(id: string) {
  const { data } = await admin.from("posts").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function newPost(member: Member, body = "hello from the grow room", extra: Record<string, unknown> = {}) {
  const { data, error } = await member.client
    .from("posts")
    .insert({ author_id: member.id, body, ...extra })
    .select("id, kind, created_at")
    .single();
  if (error) throw error;
  return data;
}

/** Expect a database error whose message or code matches. */
export function expectDbError(
  result: { error: { message: string; code?: string } | null },
  match: RegExp | string,
): void {
  if (!result.error) throw new Error(`Expected an error matching ${match}, got success`);
  const text = `${result.error.code ?? ""} ${result.error.message}`;
  const ok = typeof match === "string" ? text.includes(match) : match.test(text);
  if (!ok) throw new Error(`Expected error matching ${match}, got: ${text}`);
}
