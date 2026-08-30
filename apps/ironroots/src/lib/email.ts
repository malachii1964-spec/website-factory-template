import { Resend } from "resend";

/**
 * Thin Resend wrapper. Every function is a safe no-op until RESEND_API_KEY is
 * set, so the app runs fine in dev and activates the moment a key is added.
 */

const FROM =
  process.env.RESEND_FROM || "Lake Erie IronRoots <hello@lakeerieironroots.com>";
const CONTACT_TO = process.env.CONTACT_EMAIL || "hello@lakeerieironroots.com";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dde2d1;border-radius:12px;overflow:hidden">
<tr><td style="padding:28px 32px;border-bottom:1px solid #dde2d1">
<span style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#0e4f4a;font-weight:700">Lake Erie</span><br/>
<span style="font-size:20px;font-weight:600;color:#14231c">Iron<span style="font-style:italic;color:#0e4f4a">Roots</span></span>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:20px;color:#14231c;font-weight:600">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #dde2d1;color:#55604f;font-size:12px">
Grown on the Lake Erie shoreline, for our own county.
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendOrderConfirmationEmail(opts: {
  to: string;
  items: { title: string; qty: number; unit: string }[];
  totalCents: number;
  donationCents?: number;
}): Promise<{ ok: boolean }> {
  const resend = client();
  if (!resend) return { ok: false };
  const lines = opts.items
    .map(
      (i) =>
        `<div style="padding:8px 0;border-bottom:1px solid #eaeee1;color:#14231c;font-size:14px">${i.qty}× ${i.title}</div>`,
    )
    .join("");
  const total = `$${(opts.totalCents / 100).toFixed(2)}`;
  const donationLine = opts.donationCents
    ? `<p style="margin:0 0 16px;color:#0e4f4a;font-size:14px;line-height:1.6">Plus your <strong>$${(opts.donationCents / 100).toFixed(2)} Community Harvest Fund</strong> donation — thank you. It goes straight toward another family's Community Share.</p>`
    : "";
  const body = `
<p style="margin:0 0 16px;color:#55604f;font-size:15px;line-height:1.6">Thanks for your order. Here's what we're picking for you:</p>
<div style="margin:0 0 16px">${lines}</div>
<p style="margin:0 0 16px;color:#14231c;font-size:15px;font-weight:600">Total: ${total}</p>
${donationLine}
<p style="margin:0;color:#55604f;font-size:13px;line-height:1.6">Questions about pickup or delivery? Just reply to this email.</p>`;
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: "Your Lake Erie IronRoots order is confirmed",
      html: shell("Order confirmed", body),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendCsaWelcomeEmail(opts: {
  to: string;
  planName: string;
}): Promise<{ ok: boolean }> {
  const resend = client();
  if (!resend) return { ok: false };
  const body = `
<p style="margin:0 0 16px;color:#55604f;font-size:15px;line-height:1.6">You're in. You're now subscribed to <strong style="color:#14231c">${opts.planName}</strong> — we'll pack a fresh box every week from whatever is at peak on the farm.</p>
<p style="margin:0;color:#55604f;font-size:13px;line-height:1.6">Want to pause or cancel a week? Just reply to this email.</p>`;
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: "Welcome to the Harvest Box CSA",
      html: shell("Welcome to the Harvest Box", body),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendContactMessage(opts: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean }> {
  const resend = client();
  if (!resend) return { ok: false };
  const body = `
<p style="margin:0 0 8px;color:#55604f;font-size:14px"><strong style="color:#14231c">From:</strong> ${opts.name} (${opts.email})</p>
<p style="margin:16px 0 0;color:#14231c;font-size:15px;line-height:1.6;white-space:pre-wrap">${opts.message}</p>`;
  try {
    await resend.emails.send({
      from: FROM,
      to: CONTACT_TO,
      replyTo: opts.email,
      subject: `New message from ${opts.name}`,
      html: shell("New contact form message", body),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
