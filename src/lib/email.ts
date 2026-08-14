import nodemailer from "nodemailer";

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
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[strollo] Email not configured — would have sent "${params.subject}" to ${params.to}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
  } catch (err) {
    // Email is a best-effort side channel alongside the in-app notification
    // (which already succeeded by the time this is called) — never let a
    // delivery failure surface as an error to the customer mid-booking-flow.
    console.error(`[strollo] Failed to send email "${params.subject}" to ${params.to}:`, err);
  }
}

function emailShell(title: string, message: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      <p style="font-size: 20px; font-weight: 700; color: #243b5a; margin: 0 0 4px;">Strollo</p>
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 24px;">Happy Steps, Happy Dogs</p>
      <h1 style="font-size: 16px; margin: 0 0 12px;">${title}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">${message}</p>
      <p style="font-size: 11px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e0d8; padding-top: 12px;">
        This is an automated message from Strollo.
      </p>
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
}): Promise<void> {
  if (!params.email) return;
  await sendEmail({
    to: params.email,
    subject: params.title,
    html: emailShell(params.title, params.message),
  });
}
