import type { Metadata } from "next";
import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { MapEmbed } from "@/components/MapEmbed";
import { OpenStatus } from "@/components/OpenStatus";
import { weeklyHoursRows } from "@/lib/hours";
import { site, addressOneLine } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visit & Contact",
  description: `Visit Mike's Nursery at ${addressOneLine}. Hours, directions, phone, and a quick contact form.`,
};

export default function ContactPage() {
  const rows = weeklyHoursRows();
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;

  return (
    <>
      <PageHero
        eyebrow="Come see us"
        title="Visit the greenhouses"
        intro="Off Route 394 in Lakewood, minutes from Jamestown. Call ahead, ask a question, or just stop in — we love talking plants."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Left: contact details */}
            <div>
              <h2 className="font-display text-2xl text-canopy">Reach us directly</h2>
              <ul className="mt-6 space-y-4">
                <ContactRow icon={Phone} label="Call the greenhouse" href={site.phoneHref} value={site.phone} />
                <ContactRow icon={MapPin} label="Find us" href={mapHref} value={addressOneLine} external />
                <ContactRow icon={Mail} label="Email" href={`mailto:${site.email}`} value={site.email} />
              </ul>

              <div className="mt-8 rounded-2xl border border-mist bg-white/50 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-2 font-display text-lg text-canopy">
                    <Clock size={18} className="text-leaf" aria-hidden /> Hours
                  </h3>
                  <OpenStatus className="text-loam" />
                </div>
                <dl className="mt-4 space-y-1.5">
                  {rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-mist py-1.5 text-sm last:border-0">
                      <dt className="text-loam-soft">{r.label}</dt>
                      <dd className="font-medium tabular-nums text-loam">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-8 h-64 overflow-hidden rounded-2xl border border-mist shadow-sm">
                <MapEmbed className="min-h-[16rem]" />
              </div>
            </div>

            {/* Right: form */}
            <div>
              <div className="rounded-2xl border border-mist bg-paper-dim/60 p-6 sm:p-8">
                <h2 className="font-display text-2xl text-canopy">Send us a message</h2>
                <p className="mt-2 text-sm text-loam-soft">
                  Questions about availability, a grow setup, or a big landscaping order?
                  We&rsquo;ll get right back to you.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex items-start gap-4 rounded-xl border border-mist bg-white/50 p-4 transition-colors hover:border-leaf/40"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canopy/10 text-canopy">
          <Icon size={20} aria-hidden />
        </span>
        <span>
          <span className="block text-xs font-medium uppercase tracking-wide text-loam-soft">{label}</span>
          <span className="mt-0.5 block font-semibold text-canopy group-hover:text-leaf">{value}</span>
        </span>
      </a>
    </li>
  );
}
