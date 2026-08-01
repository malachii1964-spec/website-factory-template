"use client";

import { useState } from "react";
import { Phone, MessageSquare, Check, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { REQUEST_TYPES, TIMING_OPTIONS } from "@/lib/request-schema";
import { site, formatPhone, telHref, smsHref } from "@/lib/site";

type FieldErrors = Partial<Record<string, string[]>>;
type Status = "idle" | "submitting" | "success" | "error";

const inputCls =
  "w-full min-h-11 rounded-md border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const labelCls = "readout mb-1.5 block text-xs font-medium text-muted-foreground";

export function RequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const phone = formatPhone(site.phoneDigits);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setStatus("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (body.fieldErrors) setErrors(body.fieldErrors);
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="ticket ticket--perf p-6 pt-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-tint text-accent">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-bold">Request received.</h3>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          Thanks — the dispatcher has your run and will call or text you right back
          with one guaranteed price before we go.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <a href={telHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Phone className="h-4 w-4" /> Or call {phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="ticket ticket--perf p-5 pt-7 sm:p-6 sm:pt-8">
      {/* Honeypot — visually hidden, off-screen; real users never see it */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.name}>
          <input name="name" required autoComplete="name" placeholder="Mary Jones" className={inputCls} />
        </Field>
        <Field label="Phone we can reach you at" error={errors.phone}>
          <input name="phone" required type="tel" autoComplete="tel" placeholder="716-000-0000" className={inputCls} />
        </Field>
        <Field label="What kind of run?" error={errors.requestType}>
          <select name="requestType" required defaultValue={REQUEST_TYPES[0]} className={inputCls}>
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="When?" error={errors.timing}>
          <select name="timing" required defaultValue={TIMING_OPTIONS[0]} className={inputCls}>
            {TIMING_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Pickup (optional)" error={errors.pickup}>
          <input name="pickup" autoComplete="off" placeholder="Store, address, or town" className={inputCls} />
        </Field>
        <Field label="Dropoff (optional)" error={errors.dropoff}>
          <input name="dropoff" autoComplete="off" placeholder="Where it's going" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="What do you need?" error={errors.details}>
            <textarea
              name="details"
              required
              rows={4}
              placeholder="Tell us the run — what to grab, where from, where to, anything special."
              className={`${inputCls} resize-y`}
            />
          </Field>
        </div>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-md border border-border-strong bg-surface-2 px-4 py-3 text-sm">
          Sorry — we couldn&rsquo;t send that just now. Please call or text us
          directly and we&rsquo;ll take care of it:{" "}
          <a href={telHref(site.phoneDigits)} className="font-semibold text-accent underline">
            {phone}
          </a>
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className={buttonVariants({ size: "lg" })}
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>Send my request</>
          )}
        </button>
        <a href={smsHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <MessageSquare className="h-4 w-4" /> Rather text? {phone}
        </a>
      </div>
      <p className="readout mt-3 text-xs text-muted-foreground">
        You approve one guaranteed price before we go. No charge to ask.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {error?.[0] && <span className="mt-1 block text-sm text-accent">{error[0]}</span>}
    </label>
  );
}
