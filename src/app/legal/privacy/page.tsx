import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FutureDeskAI collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 2026">
      <h2>What we collect</h2>
      <p>
        We collect the information you give us when you buy or sign up — your
        email address and, for purchases, the billing details you enter at
        checkout. We also collect basic, anonymized analytics about how the site
        is used so we can improve it.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are handled by Stripe. We never see or store your full card
        number — Stripe processes it securely on their systems under their own
        privacy and security standards.
      </p>

      <h2>How we use your information</h2>
      <p>
        To deliver the products you bought, send your receipts and download
        links, provide support, and — if you opt in — send occasional updates and
        new-product announcements. You can unsubscribe from marketing emails at
        any time.
      </p>

      <h2>What we don&rsquo;t do</h2>
      <p>
        We don&rsquo;t sell your personal information. We only share it with the
        service providers we need to run the business (such as our payment and
        email providers), and only to the extent required to deliver what you
        asked for.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to access, correct, or delete your personal information at
        any time by contacting us through the site.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your privacy? Reach out through the contact details on the
        site.
      </p>
    </LegalLayout>
  );
}
