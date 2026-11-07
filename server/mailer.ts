// Outgoing email: password resets and notifications to DB Gas.
//
// SMTP settings come from environment variables first:
//   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASS, MAIL_FROM
// then fall back to Admin -> Email settings.
// Notifications go to NOTIFY_EMAIL (default accounts@drewbulle.co.zw).
import nodemailer from "nodemailer";
import { storage } from "./storage";

const DEFAULT_NOTIFY = "accounts@drewbulle.co.zw";

type TransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: string;
};

async function getTransportConfig(): Promise<TransportConfig | null> {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    return {
      host: process.env.SMTP_HOST.trim(),
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
      // Zoho (and most providers) reject mail whose From differs from the login.
      from: process.env.MAIL_FROM || `DB Gas <${process.env.SMTP_USER.trim()}>`,
    };
  }
  try {
    const s: any = await storage.getEmailSettings();
    if (s?.smtpHost && s?.smtpUser && s?.smtpPassword) {
      const port = Number(s.smtpPort) || 465;
      return {
        host: s.smtpHost,
        port,
        secure: port === 465,
        auth: { user: s.smtpUser, pass: s.smtpPassword },
        from: `${s.fromName || "DB Gas"} <${s.fromEmail || s.smtpUser}>`,
      };
    }
  } catch (err) {
    console.error("Could not read email settings:", err);
  }
  return null;
}

export async function getNotifyAddress(): Promise<string> {
  if (process.env.NOTIFY_EMAIL) return process.env.NOTIFY_EMAIL;
  try {
    const s: any = await storage.getEmailSettings();
    return s?.orderNotificationEmail || s?.contactFormRecipient || DEFAULT_NOTIFY;
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export type MailResult = { ok: true } | { ok: false; error: string };

/** Turn SMTP errors into something a non-technical person can act on. */
function explain(err: any, cfg: TransportConfig): string {
  const code = err?.code || "";
  const msg = String(err?.response || err?.message || err);
  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION" || /timeout/i.test(msg)) {
    return `Could not connect to ${cfg.host}:${cfg.port} (${code || "timeout"}). Afrihost is blocking this mail port. Try SMTP_PORT 587; if that also fails, use Zoho ZeptoMail (set ZEPTOMAIL_TOKEN and ZEPTOMAIL_FROM), which is never blocked.`;
  }
  if (code === "EAUTH" || /535|auth/i.test(msg)) {
    return `The mail server rejected the username/password for ${cfg.auth.user}. If the mailbox uses two-factor login, create an app-specific password in Zoho and use that as SMTP_PASS. (${msg.slice(0, 160)})`;
  }
  if (/553|sender|relay/i.test(msg)) {
    return `The mail server refused the sender address. Set MAIL_FROM to an address on ${cfg.auth.user.split("@")[1] || "your domain"}. (${msg.slice(0, 160)})`;
  }
  return msg.slice(0, 300);
}

// ---- Zoho ZeptoMail (HTTPS API on port 443 - works where hosts block SMTP) ----
//   ZEPTOMAIL_TOKEN   the "Send Mail token" from ZeptoMail -> Mail Agent -> SMTP/API
//   ZEPTOMAIL_FROM    a sender address on your verified domain, e.g. noreply@drewbulle.co.zw
//   ZEPTOMAIL_BOUNCE  (optional) bounce address set up in the mail agent
//   ZEPTOMAIL_API_URL (optional) e.g. https://api.zeptomail.eu/v1.1/email for EU accounts
function parseFrom(value: string) {
  const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, "") || "DB Gas", address: m[2].trim() } : { name: "DB Gas", address: value.trim() };
}

async function sendViaZeptoMail(to: string, subject: string, text: string, html?: string, replyTo?: string): Promise<MailResult> {
  const raw = (process.env.ZEPTOMAIL_TOKEN || "").trim();
  const token = raw.replace(/^zoho-enczapikey\s+/i, "");
  const from = parseFrom(process.env.ZEPTOMAIL_FROM || process.env.MAIL_FROM || "");
  if (!from.address.includes("@")) {
    return { ok: false, error: "Set ZEPTOMAIL_FROM to an address on your verified domain, e.g. noreply@drewbulle.co.zw" };
  }
  const body: Record<string, unknown> = {
    from,
    to: [{ email_address: { address: to } }],
    subject,
    textbody: text,
  };
  if (html) body.htmlbody = html;
  if (process.env.ZEPTOMAIL_BOUNCE) body.bounce_address = process.env.ZEPTOMAIL_BOUNCE;
  // ZeptoMail only accepts reply-to addresses on the verified sending domain.
  const domain = from.address.split("@")[1]?.toLowerCase();
  if (replyTo && replyTo.toLowerCase().endsWith("@" + domain)) body.reply_to = [{ address: replyTo }];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Zoho-enczapikey ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    const data: any = await res.json().catch(() => ({}));
    const detail = data?.error?.details?.[0]?.message || data?.error?.message || data?.message || `HTTP ${res.status}`;
    let error = `ZeptoMail refused the email: ${detail}`;
    if (res.status === 401 || /token|unauthori/i.test(detail)) error += ". Check ZEPTOMAIL_TOKEN is the Send Mail token for this mail agent.";
    if (/domain|from|sender/i.test(detail)) error += ". ZEPTOMAIL_FROM must use a domain verified in ZeptoMail.";
    console.error(`Email to ${to} failed: ${error}`);
    return { ok: false, error };
  } catch (err: any) {
    const error = err?.name === "AbortError" ? "ZeptoMail did not respond within 20 seconds." : `Could not reach ZeptoMail: ${err?.message || err}`;
    console.error(`Email to ${to} failed: ${error}`);
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendMailDetailed(to: string, subject: string, text: string, html?: string, replyTo?: string): Promise<MailResult> {
  if (process.env.ZEPTOMAIL_TOKEN) return sendViaZeptoMail(to, subject, text, html, replyTo);
  const cfg = await getTransportConfig();
  if (!cfg) {
    const error = "Email is not configured. Set ZEPTOMAIL_TOKEN + ZEPTOMAIL_FROM (recommended on Afrihost), or SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS, in cPanel and restart.";
    console.error(`Email to ${to} not sent: ${error}`);
    return { ok: false, error };
  }
  const { from, ...transport } = cfg;
  try {
    await nodemailer
      .createTransport({ ...transport, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 })
      .sendMail({ from, to, subject, text, html, replyTo });
    return { ok: true };
  } catch (err) {
    const error = explain(err, cfg);
    console.error(`Email to ${to} failed: ${error}`);
    return { ok: false, error };
  }
}

export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  return (await sendMailDetailed(to, subject, text, html)).ok;
}

/** Fire-and-forget notification to DB Gas; never delays or breaks the customer's request. */
export function notifyBusiness(subject: string, lines: Array<[string, string | number | null | undefined]>, replyTo?: string) {
  const rows = lines.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const html =
    `<h2 style="font-family:Arial,sans-serif;color:#1b365d">${esc(subject)}</h2>` +
    `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(String(v))}</td></tr>`,
      )
      .join("") +
    `</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#9ca3af">Sent by dbgas.co.zw</p>`;
  void (async () => {
    const to = await getNotifyAddress();
    await sendMailDetailed(to, `[DB Gas website] ${subject}`, text, html, replyTo);
  })().catch((err) => console.error("Notification failed:", err));
}
