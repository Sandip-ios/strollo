import Razorpay from "razorpay";
import crypto from "crypto";

export function isRazorpayConfigured(): boolean {
  const configured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );

  if (
    configured &&
    process.env.RAZORPAY_KEY_ID !== process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  ) {
    // This is the #1 cause of Razorpay's "Authentication key was missing
    // during initialization" error — the two key values must be identical.
    console.warn(
      "[strollo] RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID don't match. " +
        "They must be the exact same value, or checkout will fail."
    );
  }

  return configured;
}

export function getRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
}

// Verifies the signature Razorpay's checkout returns after a successful
// payment. This is the source of truth for "did the payment actually
// succeed" — never trust the client-side success callback alone.
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
