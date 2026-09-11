import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/modules/contact/contact.schema";
import { sendEmail, emailShell } from "@/lib/email";

// Where contact-form submissions get routed — separate from CONTACT.email
// in @/lib/site, which is the address shown publicly on the site.
const CONTACT_FORM_TO = "hardikjee@gmail.com";
const CONTACT_FORM_CC = "patelsandip8889@gmail.com";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, phone, message } = parsed.data;

  const details = `
    <p style="margin:0 0 4px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 4px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${phone ? `<p style="margin:0 0 4px;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
    <p style="margin:16px 0 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
  `;

  await sendEmail({
    to: CONTACT_FORM_TO,
    cc: CONTACT_FORM_CC,
    replyTo: email,
    subject: `New message from ${escapeHtml(name)} — Strollo contact form`,
    html: emailShell("New contact form message", details),
  });

  return NextResponse.json({ ok: true });
}
