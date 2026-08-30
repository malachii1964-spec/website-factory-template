import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Lake Erie IronRoots and your orders.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="August 2026">
      <h2>1. Agreement</h2>
      <p>
        By ordering from Lake Erie IronRoots, you agree to these terms. If
        you don&rsquo;t agree, please don&rsquo;t place an order.
      </p>

      <h2>2. What you&rsquo;re buying</h2>
      <p>
        We sell fresh, perishable produce and a recurring Harvest Box
        subscription. Availability changes with the growing season and what
        the farm actually has ready that week — the Harvest Wheel on each
        product page shows realistic, not guaranteed, availability.
      </p>

      <h2>3. Payment</h2>
      <p>
        Payments are processed securely by Stripe. Prices are shown in US
        dollars. One-time orders are charged at checkout; the Harvest Box CSA
        is a recurring subscription you can pause or cancel at any time.
      </p>

      <h2>4. Pickup &amp; delivery</h2>
      <p>
        Orders are prepared for local farm-stand pickup or delivery within
        our service area. Because produce is perishable, we don&rsquo;t
        offer long-distance shipping.
      </p>

      <h2>5. Freshness &amp; issues</h2>
      <p>
        If anything in your order arrives damaged or not as described,
        contact us within 48 hours and we&rsquo;ll make it right — a
        replacement or a refund for the affected item.
      </p>

      <h2>6. Subscriptions</h2>
      <p>
        The Harvest Box CSA renews automatically each billing period until
        you pause or cancel. You can manage your subscription from your
        account or by contacting us directly.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about these terms? Reach out through our{" "}
        <a href="/contact" className="text-foreground underline underline-offset-4">
          contact page
        </a>{" "}
        and we&rsquo;ll get back to you.
      </p>
    </LegalLayout>
  );
}
