import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { business, hoursDisplay, seasonDisplay } from "@/lib/business";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with Timmerman's Farm and Market — call ${business.phone} or send a message.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="marker-tag text-xl text-barn">contact</p>
      <h1 className="mt-1 font-display text-4xl font-semibold italic text-espresso sm:text-5xl">
        Get in touch
      </h1>
      <p className="mt-5 max-w-xl text-lg text-espresso-soft">
        Quickest way to reach us is by phone, especially during the season.
        For anything else, send a message and we&rsquo;ll get back to you.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <div className="rounded-lg border border-cream-line bg-paper-deep p-6">
            <a href={business.phoneHref} className="flex items-center gap-3 text-espresso hover:text-barn-deep">
              <Phone className="h-5 w-5 shrink-0 text-barn-deep" aria-hidden="true" />
              <span className="font-semibold">{business.phone}</span>
            </a>
            <p className="mt-3 flex items-start gap-3 text-sm text-espresso-soft">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-barn-deep" aria-hidden="true" />
              {business.addressLine}
            </p>
            <p className="mt-4 text-sm text-espresso-soft">{hoursDisplay}</p>
            <p className="text-sm text-espresso-soft">{seasonDisplay}</p>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
