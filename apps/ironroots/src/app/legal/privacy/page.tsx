import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lake Erie IronRoots collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 2026">
      <h2>1. What we collect</h2>
      <p>
        When you create an account, place an order, or subscribe to the
        Harvest Box, we collect your name, email address, and — for
        delivery orders — a mailing address. Payment details are handled
        entirely by Stripe; we never see or store your card number.
      </p>

      <h2>2. How we use it</h2>
      <p>
        We use your information to fulfill orders, manage your account and
        subscription, and send order confirmations and receipts. We
        don&rsquo;t sell your information to anyone.
      </p>

      <h2>3. Cart &amp; preferences</h2>
      <p>
        Your shopping cart is stored in your browser&rsquo;s local storage,
        not on our servers, until you check out.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We keep order and account records as long as your account is active
        or as needed to meet legal and tax obligations.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You can request a copy of your data or ask us to delete your
        account at any time by contacting us.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about this policy? Reach out through our{" "}
        <a href="/contact" className="text-foreground underline underline-offset-4">
          contact page
        </a>
        .
      </p>
    </LegalLayout>
  );
}
