import nodemailer from "nodemailer";
import path from "path";

// Where "new booking" and other admin-facing alerts go — hardcoded rather
// than the admin User row's own `email` field, since that's often unset
// for the seeded admin account and these two inboxes are the ones
// actually watched day to day.
export const ADMIN_NOTIFICATION_EMAILS = ["hardikjee@gmail.com", "patelsandip8889@gmail.com"];

// SMTP works with any provider (Gmail, SendGrid, SES, Mailgun, etc.) via
// standard relay credentials, so this doesn't lock the app into one vendor.
// Matches the app's existing pattern for optional integrations (S3,
// Razorpay, Maps): if unconfigured, calls no-op with a console note instead
// of throwing, so the rest of the flow (booking, approval, etc.) never
// fails just because email isn't set up yet.
function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
}

// Referenced by every template via cid so the logo renders inline instead
// of as a Gmail-style "attachment" chip — embedding beats a remote <img>
// src because it doesn't depend on the app being publicly reachable.
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");
const LOGO_CID = "strollo-logo";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[strollo] Email not configured — would have sent "${params.subject}" to ${params.to}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
      attachments: [
        // Only pulled in when the html actually references cid:strollo-logo
        // (i.e. was built with emailShell) — plain custom HTML skips it.
        ...(params.html.includes(`cid:${LOGO_CID}`)
          ? [{ filename: "strollo-logo.png", path: LOGO_PATH, cid: LOGO_CID, contentDisposition: "inline" as const }]
          : []),
        ...(params.attachments ?? []),
      ],
    });
  } catch (err) {
    // Email is a best-effort side channel alongside the in-app notification
    // (which already succeeded by the time this is called) — never let a
    // delivery failure surface as an error to the customer mid-booking-flow.
    console.error(`[strollo] Failed to send email "${params.subject}" to ${params.to}:`, err);
  }
}

// Table-based layout deliberately, not flex/grid — this has to render in
// Outlook's Word engine too, not just Gmail/Apple Mail.
export function emailShell(title: string, message: string, cta?: { label: string; url: string }): string {
  return `
    <div style="background-color:#f7f9fb; padding:32px 16px; font-family: -apple-system, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8ef;">
        <tr>
          <td style="background-color:#eef2f6; padding:28px 32px; text-align:center;">
            <img src="cid:${LOGO_CID}" alt="Strollo" width="160" style="display:block; margin:0 auto; height:auto; border:0;" />
          </td>
        </tr>
        <tr>
          <td style="height:4px; background-color:#4b83b2; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px; font-size:18px; color:#1c2530; font-weight:700;">${title}</h1>
            <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">${message}</p>
            ${
              cta
                ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr>
                      <td style="border-radius:10px; background-color:#243b5a;">
                        <a href="${cta.url}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">${cta.label}</a>
                      </td>
                    </tr>
                  </table>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px; background-color:#f7f9fb; border-top:1px solid #e2e8ef;">
            <p style="margin:0; font-size:11px; color:#9ca3af;">This is an automated message from Strollo — Happy Steps, Happy Dogs.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Fire-and-forget alongside a Notification row — same title/message shown
// in-app, mirrored to email if the customer has one on file. Never call
// this inside a $transaction: it's a slow external call and has no place
// holding a DB connection open.
export async function notifyByEmail(params: {
  email: string | null | undefined;
  title: string;
  message: string;
  cta?: { label: string; url: string };
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}): Promise<void> {
  if (!params.email) return;
  await sendEmail({
    to: params.email,
    subject: params.title,
    html: emailShell(params.title, params.message, params.cta),
    attachments: params.attachments,
  });
}
