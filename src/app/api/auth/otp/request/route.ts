import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestOtpSchema } from "@/modules/auth/auth.schema";
import { requestOtp } from "@/modules/auth/otp.service";
import { checkRateLimit } from "@/lib/rate-limit";

const OTP_REQUEST_LIMIT = 5;
const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 min

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = requestOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { mobileNumber, purpose } = parsed.data;

  const rateLimit = checkRateLimit(`otp-request:${mobileNumber}`, OTP_REQUEST_LIMIT, OTP_REQUEST_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many OTP requests. Try again in ${Math.ceil(rateLimit.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });

  // A number added as a walker by admin can log in even before it has a
  // User row yet — the User account gets created on first successful
  // verify. Signup is blocked for walker numbers so a walker can't
  // accidentally end up with a CUSTOMER account under the same number.
  const walkerMatch = await prisma.walker.findFirst({
    where: { mobileNumber, deletedAt: null, isActive: true },
  });

  if (purpose === "SIGNUP") {
    if (existingUser) {
      return NextResponse.json(
        { error: "This number is already registered. Please login instead." },
        { status: 409 }
      );
    }
    if (walkerMatch) {
      return NextResponse.json(
        { error: "This number is registered as a walker. Please use Login instead." },
        { status: 409 }
      );
    }
  }

  if (purpose === "LOGIN" && !existingUser && !walkerMatch) {
    return NextResponse.json(
      { error: "This number isn't registered yet. Please sign up first." },
      { status: 404 }
    );
  }

  await requestOtp(mobileNumber, purpose);

  // In dev/test, we surface the code directly since no SMS provider is
  // wired up yet. Remove this field once a real provider is connected.
  return NextResponse.json({
    success: true,
    devNote: "OTP delivery is stubbed — use 123456 to verify.",
  });
}
