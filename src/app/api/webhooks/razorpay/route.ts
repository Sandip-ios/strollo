import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmBookingPayment } from "@/lib/booking-confirmation";

// Server-to-server confirmation, independent of the client-side checkout
// callback in /api/bookings/[id]/verify. Closes the gap where a customer's
// tab closes or connection drops between Razorpay charging them and the
// client callback firing — without this, Razorpay has the money but the
// booking stays PENDING_PAYMENT forever. Configure this URL
// (<host>/api/webhooks/razorpay) and a webhook secret in the Razorpay
// dashboard, then set RAZORPAY_WEBHOOK_SECRET to that same secret here.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[strollo] Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set — rejecting.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Must verify against the raw request body — re-serializing parsed JSON
  // can produce different bytes and silently break signature verification.
  const rawBody = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expected !== signature) {
    console.warn("[strollo] Razorpay webhook signature mismatch — rejecting.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const paymentEntity = event.payload?.payment?.entity;
    const orderId: string | undefined = paymentEntity?.order_id;
    const paymentId: string | undefined = paymentEntity?.id;

    if (orderId && paymentId) {
      const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId } });
      if (payment) {
        const result = await confirmBookingPayment({
          bookingId: payment.bookingId,
          razorpayPaymentId: paymentId,
        });
        if (!result.ok) {
          console.error(`[strollo] Webhook couldn't confirm booking ${payment.bookingId}: ${result.error}`);
        }
      } else {
        console.warn(`[strollo] Razorpay webhook: no payment found for order ${orderId}`);
      }
    }
  }

  // Always 200 once the signature checks out, even for events we don't
  // act on — Razorpay retries on non-2xx, and there's nothing to retry
  // for an event type we intentionally ignore.
  return NextResponse.json({ received: true });
}
