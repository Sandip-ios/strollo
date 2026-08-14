import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/modules/auth/auth.schema";
import { verifyOtp } from "@/modules/auth/otp.service";
import { signSession, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Looser than the request limit on purpose — a real user can genuinely
// mistype a 6-digit code a couple of times. This exists to stop a script
// from brute-forcing the code space, not to punish typos.
const OTP_VERIFY_LIMIT = 8;
const OTP_VERIFY_WINDOW_MS = 15 * 60 * 1000; // 15 min

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { mobileNumber, code, purpose, name } = parsed.data;

  const rateLimit = checkRateLimit(`otp-verify:${mobileNumber}`, OTP_VERIFY_LIMIT, OTP_VERIFY_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  const result = await verifyOtp(mobileNumber, code, purpose);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { mobileNumber } });

  if (purpose === "SIGNUP") {
    if (user) {
      return NextResponse.json(
        { error: "This number is already registered. Please login instead." },
        { status: 409 }
      );
    }
    const walkerMatch = await prisma.walker.findFirst({
      where: { mobileNumber, deletedAt: null, isActive: true },
    });
    if (walkerMatch) {
      return NextResponse.json(
        { error: "This number is registered as a walker. Please use Login instead." },
        { status: 409 }
      );
    }
    user = await prisma.user.create({
      data: { mobileNumber, name, role: "CUSTOMER", acceptedTermsAt: new Date() },
    });
  }

  if (purpose === "LOGIN" && !user) {
    // First-time walker login: no User row yet, but admin has already
    // added this number as a Walker. Create the User account now and
    // link it, rather than requiring a separate signup step.
    const walkerMatch = await prisma.walker.findFirst({
      where: { mobileNumber, deletedAt: null, isActive: true },
    });
    if (!walkerMatch) {
      return NextResponse.json(
        { error: "This number isn't registered yet. Please sign up first." },
        { status: 404 }
      );
    }
    user = await prisma.user.create({
      data: { mobileNumber, name: walkerMatch.name, role: "WALKER" },
    });
    await prisma.walker.update({ where: { id: walkerMatch.id }, data: { userId: user.id } });
  }

  if (!user) {
    // Shouldn't happen given the checks above, but keeps TS/runtime honest.
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact support." },
      { status: 403 }
    );
  }

  const token = signSession({
    userId: user.id,
    role: user.role,
    mobileNumber: user.mobileNumber,
  });
  setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, mobileNumber: user.mobileNumber, role: user.role },
  });
}
