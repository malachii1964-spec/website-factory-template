import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";
import { DraftNotice } from "../../draft-notice";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <DraftNotice />
      <p>GANJALOKA collects as little as possible and never sells your data.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account: email address and a securely hashed password.</li>
        <li>Age check: your date of birth, stored privately and never shown to anyone or included in login tokens.</li>
        <li>Profile and content: username, display name, bio, avatar, posts, photos, likes, follows, blocks and reports.</li>
        <li>Basic, cookie-free page analytics (Vercel Analytics).</li>
      </ul>
      <h2>What we don&apos;t collect</h2>
      <p>No phone number, contacts or precise location. Photo location and camera data (EXIF/GPS) are removed on your device before upload. No ad trackers.</p>
      <h2>How we use it</h2>
      <p>To run the service, keep it safe (moderation and abuse prevention), and meet legal obligations.</p>
      <h2>Who processes it</h2>
      <p>Supabase (database, login and file storage), Vercel (hosting and analytics) and Resend (account emails). They process data only to provide their services to us.</p>
      <h2>Retention and deletion</h2>
      <p>Delete your account in Settings and we remove your profile, posts, photos, likes and follows. Content under an open safety report may be kept as long as the law requires.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies only: one keeps you logged in, and one remembers that you confirmed you&apos;re 21+.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a></p>
    </>
  );
}
