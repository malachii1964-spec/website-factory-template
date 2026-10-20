import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      <p>Questions, account problems, appeals, copyright or legal requests:</p>
      <p className="text-xl"><a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a></p>
      <p>To report a post or account, use &ldquo;Report&rdquo; on it — that reaches moderators fastest. If someone is in immediate danger, contact local emergency services.</p>
    </>
  );
}
