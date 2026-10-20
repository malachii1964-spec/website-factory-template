import type { Metadata } from "next";
import { DraftNotice } from "../../draft-notice";

export const metadata: Metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <>
      <h1>Community Guidelines</h1>
      <DraftNotice />
      <p>GANJALOKA is a place for adults to share cannabis culture. These rules keep it that way. Break them and moderators may remove posts or suspend accounts.</p>
      <h2>1. 21 and over, always</h2>
      <p>You must be 21 or older to have an account. Don&apos;t post content involving anyone under 21, and never share anything that sexualizes minors — we report it to the National Center for Missing &amp; Exploited Children.</p>
      <h2>2. No buying or selling</h2>
      <p>No sales, trades, prices, menus, &ldquo;DM me&rdquo; or &ldquo;link in bio&rdquo; offers, delivery, shipping or payment details for cannabis or THC products. Talking about what you paid at a licensed dispensary is fine; arranging a deal is not.</p>
      <h2>3. Protect people&apos;s privacy and grows</h2>
      <p>Don&apos;t post anyone&apos;s address, location, workplace, real name or photos of them without consent. Don&apos;t try to locate someone&apos;s grow.</p>
      <h2>4. Respect each other</h2>
      <p>No hate speech or slurs, harassment, threats, or content that glorifies violence. Disagree about strains all you want — attack ideas, not people.</p>
      <h2>5. Keep it real</h2>
      <p>No spam, scams, impersonation or fake engagement. Health information is welcome as personal experience, not medical advice.</p>
      <h2>6. Consumption content</h2>
      <p>Showing legal adult use is part of the culture. Don&apos;t encourage excessive use, impaired driving, or use by anyone under 21.</p>
      <h2>Reporting</h2>
      <p>Use &ldquo;Report&rdquo; on any post or profile. Moderators review reports within 24 hours, and child-safety reports first. You can block anyone at any time.</p>
    </>
  );
}
