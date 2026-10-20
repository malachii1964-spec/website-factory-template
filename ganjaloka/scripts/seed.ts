// Local demo data: `pnpm seed` (local Supabase only). Idempotent per run tag.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SECRET = process.env.SUPABASE_SECRET_KEY;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SECRET || !PUBLISHABLE) throw new Error("Set Supabase keys in .env.local (see .env.example).");
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("Seed only runs against local Supabase.");

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

const MEMBERS = [
  { username: "nightgrower", display: "Night Grower", bio: "Indoor, living soil, slow and low. Week 7 of a purple pheno hunt." },
  { username: "terpene_tasha", display: "Terpene Tasha", bio: "Myrcene, limonene, caryophyllene — I smell everything. Sessions + reviews." },
  { username: "hashmaker_ray", display: "Ray Makes Hash", bio: "Ice water, micron bags and patience." },
];

const POSTS: Record<string, string[]> = {
  nightgrower: [
    "Trichomes going milky across the top colas. Giving it another 10 days for some amber.",
    "PSA: strip location data from your grow photos before posting anywhere. GANJALOKA does it for you, but your phone gallery doesn't.",
  ],
  terpene_tasha: [
    "Hot take: limonene-forward strains are wasted on wake-and-bake. Save them for the afternoon.",
    "What's the one terpene you can pick out blind? Mine is pinene, every time.",
  ],
  hashmaker_ray: ["Fresh frozen run today. Cold water, gentle agitation, and no rushing the dry."],
};

const password = "growroom2026";
for (const m of MEMBERS) {
  const email = `${m.username}@demo.ganjaloka.dev`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: m.username, display_name: m.display, birth_date: "1988-04-20", terms_version: "2026-10-19" },
  });
  if (created.error && !/already/i.test(created.error.message)) throw created.error;
  const member = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });
  const { data: session, error } = await member.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const id = session.user.id;
  await member.from("profiles").update({ bio: m.bio }).eq("id", id);
  for (const body of POSTS[m.username] ?? []) {
    await member.from("posts").insert({ author_id: id, body });
  }
  console.log(`seeded @${m.username} (${email} / ${password})`);
}
