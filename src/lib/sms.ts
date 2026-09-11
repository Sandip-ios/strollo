// Two independent, optional channels, tried in order:
//   1. WhatsApp via Twilio (only if TWILIO_WHATSAPP_FROM is set)
//   2. SMS via DS3 (India DLT-registered gateway) — the provider actually
//      in use right now
//   3. SMS via Twilio (only if TWILIO_SMS_FROM is set and DS3 isn't)
// Same optional-integration pattern as email/OTP elsewhere in this app: if
// nothing is configured, this no-ops with a console log instead of
// throwing, so the booking-assignment flow never fails just because
// WhatsApp/SMS isn't set up.

function isTwilioWhatsAppConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

function isTwilioSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM);
}

// DS3 is a DLT-registered Indian SMS gateway: the carrier-side DLT scrubber
// rejects any message body that doesn't match the exact template registered
// under DS3_SMS_TEMPLATE_ID (with variables substituted in place) — so the
// caller-supplied `message` here must already be that rendered template
// text, not arbitrary free text.
function isDs3Configured(): boolean {
  return Boolean(
    process.env.DS3_SMS_USER &&
      process.env.DS3_SMS_KEY &&
      process.env.DS3_SMS_SENDER_ID &&
      process.env.DS3_SMS_ENTITY_ID &&
      process.env.DS3_SMS_TEMPLATE_ID
  );
}

async function sendViaTwilio(params: { to: string; message: string; whatsapp: boolean }): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const from = params.whatsapp ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : (process.env.TWILIO_SMS_FROM as string);
  const to = params.whatsapp ? `whatsapp:${params.to}` : params.to;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: params.message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
}

async function sendViaDs3(params: { to: string; message: string }): Promise<void> {
  const query = new URLSearchParams({
    user: process.env.DS3_SMS_USER as string,
    key: process.env.DS3_SMS_KEY as string,
    mobile: params.to,
    message: params.message,
    senderid: process.env.DS3_SMS_SENDER_ID as string,
    accusage: "1", // Transactional
    entityid: process.env.DS3_SMS_ENTITY_ID as string,
    tempid: process.env.DS3_SMS_TEMPLATE_ID as string,
  });

  const res = await fetch(`http://redirect.ds3.in/submitsms.jsp?${query.toString()}`);
  const text = await res.text();
  // DS3 replies 200 with a plain-text status line even on failure, so check
  // the body for an explicit error rather than trusting the HTTP status.
  if (!res.ok || /error|fail/i.test(text)) {
    throw new Error(`DS3 responded: ${text}`);
  }
}

// `to` must already be in E.164 form (this app's mobileNumber fields always
// are — see auth.schema.ts / walker.schema.ts, which prefix "+91" at input
// time).
export async function notifyByWhatsAppOrSms(params: { to: string; message: string }): Promise<void> {
  try {
    if (isTwilioWhatsAppConfigured()) {
      await sendViaTwilio({ to: params.to, message: params.message, whatsapp: true });
      return;
    }
    if (isDs3Configured()) {
      await sendViaDs3(params);
      return;
    }
    if (isTwilioSmsConfigured()) {
      await sendViaTwilio({ to: params.to, message: params.message, whatsapp: false });
      return;
    }
    console.log(`[strollo] WhatsApp/SMS not configured — would have sent to ${params.to}: "${params.message}"`);
  } catch (err) {
    // Best-effort side channel alongside the in-app notification and email
    // (both already succeeded by the time this is called) — never let a
    // delivery failure surface to the admin mid-assignment.
    console.error(`[strollo] Failed to send WhatsApp/SMS to ${params.to}:`, err);
  }
}
