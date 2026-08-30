import type { Metadata } from "next";
import { MapPin, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about pickup, delivery, or the Harvest Box CSA? Get in touch.",
};

const DETAILS = [
  { icon: MapPin, label: "Pickup", value: "Farm stand pickup available across the county" },
  { icon: Clock, label: "Order by", value: "Sunday night for Thursday harvest" },
  { icon: Mail, label: "Email", value: "hello@lakeerieironroots.com" },
];

export default function ContactPage() {
  return (
    <section className="py-16 lg:py-20">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
            Questions about pickup, delivery, or the CSA?
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Send a message and we&rsquo;ll get back to you — usually within a day.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {DETAILS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.label}</p>
                    <p className="text-sm text-muted-foreground">{d.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel p-6 lg:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
