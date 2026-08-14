import { prisma } from "@/lib/prisma";

const STATIC_TEST_CODE = process.env.OTP_STATIC_TEST_CODE || "123456";
const OTP_TTL_MINUTES = 10;

export type OtpPurpose = "SIGNUP" | "LOGIN";

// Creates an OTP request record. Real SMS sending is NOT wired up yet —
// this always "succeeds" and the code is always the static test code.
// Swap the body of this function later to call MSG91/Twilio/etc; nothing
// else in the auth flow needs to change.
export async function requestOtp(mobileNumber: string, purpose: OtpPurpose) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpRequest.create({
    data: {
      mobileNumber,
      code: STATIC_TEST_CODE,
      purpose,
      expiresAt,
    },
  });

  return { success: true };
}

export async function verifyOtp(
  mobileNumber: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ valid: boolean; reason?: string }> {
  // Test-mode shortcut: the static code always works regardless of
  // whether a specific OtpRequest row matches, so local/dev testing
  // isn't blocked by request/verify timing.
  if (code !== STATIC_TEST_CODE) {
    return { valid: false, reason: "Incorrect OTP" };
  }

  const latestRequest = await prisma.otpRequest.findFirst({
    where: { mobileNumber, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!latestRequest) {
    return { valid: false, reason: "No OTP was requested for this number" };
  }

  if (latestRequest.expiresAt < new Date()) {
    return { valid: false, reason: "OTP has expired, please request a new one" };
  }

  await prisma.otpRequest.update({
    where: { id: latestRequest.id },
    data: { isVerified: true },
  });

  return { valid: true };
}
