import { Resend } from "resend";

/**
 * Thin Resend wrapper. Every function is a safe no-op until RESEND_API_KEY is
 * set, so the app runs fine in dev and activates the moment you add a key.
 */

const FROM = process.env.RESEND_FROM || "FutureDeskAI <hello@futuredeskai.com>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0910;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#14121f;border:1px solid #262338;border-radius:12px;overflow:hidden">
<tr><td style="padding:28px 32px;border-bottom:1px solid #262338">
<span style="font-size:18px;font-weight:700;color:#e9e8f0;letter-spacing:-0.02em">FutureDesk<span style="color:#8b7bff">AI</span></span>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:20px;color:#e9e8f0;font-weight:600">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #262338;color:#9b98ad;font-size:12px">
50% of every sale supports St. Jude Children's Research Hospital &amp; homeless veterans.
</td></tr>
</table></td></tr></table></body></html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#8b7bff;color:#0a0910;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:15px">${label}</a>`;
}

export async function sendPurchaseEmail(opts: {
  to: string;
  productName: string;
  downloadUrl: string;
}): Promise<{ ok: boolean }> {
  const resend = client();
  if (!resend) return { ok: false };
  const body = `
<p style="margin:0 0 16px;color:#b9b7c9;font-size:15px;line-height:1.6">Thanks for your purchase — <strong style="color:#e9e8f0">${opts.productName}</strong> is ready. Your download link is below and works for 7 days.</p>
<p style="margin:0 0 24px">${btn(opts.downloadUrl, "Download now")}</p>
<p style="margin:0;color:#9b98ad;font-size:13px;line-height:1.6">Trouble with the link? Just reply to this email and we'll help.</p>`;
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Your download: ${opts.productName}`,
      html: shell("Your purchase is ready", body),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendWelcomeEmail(to: string): Promise<{ ok: boolean }> {
  const resend = client();
  if (!resend) return { ok: false };
  const body = `
<p style="margin:0 0 16px;color:#b9b7c9;font-size:15px;line-height:1.6">Welcome in. Here are three starter prompts you can use today — copy, paste into ChatGPT or Claude, and fill in the [brackets]:</p>
<div style="background:#0a0910;border:1px solid #262338;border-radius:8px;padding:16px;margin:0 0 12px;color:#b9b7c9;font-size:13px;line-height:1.6;font-family:monospace">Write a friendly follow-up to [CUSTOMER] who asked about [SERVICE] but didn't book. One short paragraph, one clear next step, no pressure.</div>
<div style="background:#0a0910;border:1px solid #262338;border-radius:8px;padding:16px;margin:0 0 12px;color:#b9b7c9;font-size:13px;line-height:1.6;font-family:monospace">Turn these rough notes into a clear, professional quote for [JOB]: [NOTES]. Include scope, price, and timeline.</div>
<div style="background:#0a0910;border:1px solid #262338;border-radius:8px;padding:16px;margin:0 0 24px;color:#b9b7c9;font-size:13px;line-height:1.6;font-family:monospace">Write a polite text asking [CUSTOMER] for a Google review after their [SERVICE]. Warm, 2 sentences, include why it helps a small business.</div>
<p style="margin:0 0 24px">${btn(process.env.NEXT_PUBLIC_SITE_URL || "https://www.futuredeskai.com", "Explore the full library")}</p>
<p style="margin:0;color:#9b98ad;font-size:13px;line-height:1.6">More prompts and tools are on the way. You can unsubscribe any time.</p>`;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Your free AI starter prompts are here",
      html: shell("Welcome to FutureDeskAI", body),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
