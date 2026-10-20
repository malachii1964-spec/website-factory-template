import type { Metadata } from "next";
import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { DraftNotice } from "../../draft-notice";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <DraftNotice />
      <p>These terms are an agreement between you and GANJALOKA. By creating an account or using the site you agree to them.</p>
      <h2>Eligibility</h2>
      <p>You must be at least 21 years old and able to form a binding contract. You confirm your date of birth when you sign up, and you must give accurate information.</p>
      <h2>Your account</h2>
      <p>Keep your password secure. You&apos;re responsible for activity on your account. You can delete your account at any time in Settings.</p>
      <h2>Your content</h2>
      <p>You own what you post. You give GANJALOKA a worldwide, non-exclusive, royalty-free license to host, display and distribute it on the service so it works as intended. Only post content you have the right to share.</p>
      <h2>Rules</h2>
      <p>You agree to follow the <Link href="/legal/guidelines">Community Guidelines</Link>. In particular, GANJALOKA does not allow buying or selling cannabis or THC products. We may remove content or suspend accounts that break the rules.</p>
      <h2>No sales, no advice</h2>
      <p>GANJALOKA is a social network, not a marketplace or a medical service. Nothing here is medical or legal advice. Follow the laws where you live.</p>
      <h2>Copyright</h2>
      <p>If you believe content on GANJALOKA infringes your copyright, report it or email <a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a> with the details required by the DMCA.</p>
      <h2>Disclaimers and liability</h2>
      <p>The service is provided &ldquo;as is.&rdquo; To the extent the law allows, GANJALOKA isn&apos;t liable for indirect or consequential damages or for content posted by members.</p>
      <h2>Changes</h2>
      <p>We may update these terms. If changes are significant we&apos;ll tell you before they take effect.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a></p>
    </>
  );
}
