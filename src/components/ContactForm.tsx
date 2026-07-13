"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { contactSchema, contactTopics, HONEYPOT_FIELD } from "@/lib/contact-schema";
import { cn } from "@/lib/cn";

type Errors = Partial<Record<string, string>>;
type State = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    const honeypot = String(fd.get(HONEYPOT_FIELD) ?? "");

    // Client-side validation first for instant feedback.
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, [HONEYPOT_FIELD]: honeypot }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setState("success");
        form.reset();
        return;
      }
      if (json.fieldErrors) setErrors(json.fieldErrors);
      setFormError(json.error ?? "Please check the highlighted fields.");
      setState("error");
    } catch {
      setFormError("Network hiccup — please try again, or give us a call.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-leaf/30 bg-white/70 p-10 text-center">
        <CheckCircle2 size={44} className="text-leaf" aria-hidden />
        <h3 className="font-display text-2xl text-canopy">Thanks — message sent!</h3>
        <p className="max-w-sm text-loam-soft">
          We&rsquo;ll get back to you soon. In a hurry? Give the greenhouse a call and
          we&rsquo;ll help you right away.
        </p>
        <Button variant="outline" onClick={() => setState("idle")}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Honeypot — visually hidden, off the accessibility tree */}
      <div aria-hidden className="absolute left-[-9999px]" hidden>
        <label>
          Company
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Your name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className={inputCls(errors.name)}
            placeholder="Jane Gardener"
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputCls(errors.email)}
            placeholder="jane@example.com"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Phone" hint="Optional" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputCls(errors.phone)}
            placeholder="(716) 555-0142"
          />
        </Field>
        <Field id="topic" label="What's it about?" error={errors.topic}>
          <select id="topic" name="topic" defaultValue={contactTopics[0]} className={inputCls(errors.topic)}>
            {contactTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={cn(inputCls(errors.message), "resize-y")}
          placeholder="Tell us what you're looking for…"
        />
      </Field>

      {formError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "submitting"} className="w-full sm:w-auto">
        {state === "submitting" ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send size={17} aria-hidden />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}

function inputCls(error?: string) {
  return cn(
    "w-full rounded-xl border bg-white/80 px-4 py-3 text-loam placeholder:text-loam-soft/50 transition-colors",
    "focus:border-leaf focus:outline-none focus:ring-2 focus:ring-grow/40",
    error ? "border-red-400" : "border-mist",
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-loam">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-loam-soft">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
