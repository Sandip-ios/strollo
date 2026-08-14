import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/modules/contact/contact.schema";
import { sendEmail } from "@/lib/email";
import { CONTACT } from "@/lib/site";

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

  await sendEmail({
    to: CONTACT.email,
    replyTo: email,
    subject: `New message from ${escapeHtml(name)} — Strollo contact form`,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
        <p style="font-size: 20px; font-weight: 700; color: #243b5a; margin: 0 0 16px;">New contact form message</p>
        <p style="font-size: 14px; margin: 0 0 4px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${phone ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
        <p style="font-size: 14px; line-height: 1.6; margin-top: 16px; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
