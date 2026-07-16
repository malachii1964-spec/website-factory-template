import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of FutureDeskAI and your purchases.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="July 2026">
      <h2>1. Agreement</h2>
      <p>
        By accessing FutureDeskAI or purchasing a product, you agree to these
        terms. If you don&rsquo;t agree, please don&rsquo;t use the site.
      </p>

      <h2>2. What you&rsquo;re buying</h2>
      <p>
        Our products are digital goods — prompt packs, templates, e-books,
        automation kits, asset packs, and courses. On purchase you receive a
        limited, non-exclusive, non-transferable license to use the product for
        your own business and client work. You may not resell, redistribute, or
        repackage the products for sale. Asset packs include a commercial-use
        license for the assets themselves.
      </p>

      <h2>3. Payment</h2>
      <p>
        Payments are processed securely by Stripe. Prices are shown in US
        dollars. Most products are a one-time payment; the Inner Circle
        membership is a recurring subscription that you can cancel at any time,
        with access continuing through the end of your paid period.
      </p>

      <h2>4. Delivery &amp; access</h2>
      <p>
        Digital products are delivered instantly after payment, on-screen and by
        email. Purchases include free updates to the product you bought.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You&rsquo;re responsible for how you use the tools and any output you
        generate with them. Our products help you work with third-party AI tools
        (such as ChatGPT, Claude, and Gemini); those tools have their own terms,
        and FutureDeskAI isn&rsquo;t affiliated with or responsible for them.
      </p>

      <h2>6. No guarantees of results</h2>
      <p>
        We build these tools to work, but results depend on how you use them and
        on factors outside our control. We don&rsquo;t guarantee specific income,
        savings, or outcomes.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about these terms? Reach out through the contact details on the
        site and we&rsquo;ll get back to you.
      </p>
    </LegalLayout>
  );
}
