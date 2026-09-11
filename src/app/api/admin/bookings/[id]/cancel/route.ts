import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";
import { computeRefundAmount } from "@/lib/refund";
import { notifyByEmail } from "@/lib/email";

const CANCELLABLE_STATUSES = ["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"] as const;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { customer: true, payment: true, walks: true, walker: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!CANCELLABLE_STATUSES.includes(booking.status as (typeof CANCELLABLE_STATUSES)[number])) {
    return NextResponse.json(
      { error: "This booking can't be cancelled from its current status" },
      { status: 409 }
    );
  }

  const totalWalks = booking.walks.length;
  const remainingScheduledWalks = booking.walks.filter((w) => w.status === "SCHEDULED").length;
  const refundAmount = computeRefundAmount({
    priceAtBookingPaise: booking.priceAtBooking,
    totalWalks,
    remainingScheduledWalks,
  });

  const wasPreApproval = booking.status === "CONFIRMED";

  // Issue the Razorpay refund BEFORE writing any DB changes — same
  // ordering principle as order creation: never leave the database saying
  // "refunded" if the payment provider call actually failed.
  let razorpayRefundId: string | null = null;
  if (refundAmount > 0 && booking.payment?.razorpayPaymentId && booking.payment.status === "SUCCESS") {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Payments aren't configured — can't process a refund right now." },
        { status: 503 }
      );
    }
    try {
      const razorpay = getRazorpayClient();
      const refund = await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
        amount: refundAmount,
        notes: { bookingId: booking.id, reason: wasPreApproval ? "booking_rejected" : "booking_cancelled" },
      });
      razorpayRefundId = refund.id;
    } catch (err) {
      console.error("[strollo] Razorpay refund failed:", err);
      const razorpayError = err as { error?: { description?: string }; message?: string };
      const detail = razorpayError?.error?.description || razorpayError?.message || "Unknown error";
      return NextResponse.json(
        { error: `Refund failed: ${detail}. No changes were made.` },
        { status: 502 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    if (refundAmount > 0 && booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "REFUNDED",
          refundAmount,
          razorpayRefundId,
          refundedAt: new Date(),
        },
      });
    }

    // These days are being refunded in cash — exclude them from ever being
    // carried forward as a free credit on a future booking too (that would
    // double-pay the customer for the same cancelled days).
    await tx.walkInstance.updateMany({
      where: { bookingId: booking.id, status: "SCHEDULED" },
      data: { status: "CANCELLED", cancelledAt: new Date(), carriedForward: true },
    });

    await tx.notification.create({
      data: {
        userId: booking.customerId,
        type: wasPreApproval ? "BOOKING_REJECTED" : "BOOKING_CANCELLED",
        title: wasPreApproval ? "Booking rejected" : "Booking cancelled",
        message:
          refundAmount > 0
            ? `Your booking has been ${wasPreApproval ? "rejected" : "cancelled"}. A refund of ₹${(refundAmount / 100).toLocaleString("en-IN")} has been initiated and should reflect in 5-7 business days.`
            : `Your booking has been ${wasPreApproval ? "rejected" : "cancelled"}.`,
      },
    });

    // A walker with walks already lined up for this booking needs to know
    // not to show up — customer-facing wording, since this is their inbox.
    if (booking.walker?.userId && remainingScheduledWalks > 0) {
      await tx.notification.create({
        data: {
          userId: booking.walker.userId,
          type: wasPreApproval ? "BOOKING_REJECTED" : "BOOKING_CANCELLED",
          title: "Walk cancelled",
          message: `The booking for ${booking.customer.name ?? booking.customer.mobileNumber}'s dog has been cancelled — no walk needed there anymore.`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: session.userId,
        action: wasPreApproval ? "BOOKING_REJECTED" : "BOOKING_CANCELLED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: { totalWalks, remainingScheduledWalks, refundAmount, razorpayRefundId },
      },
    });

    return updatedBooking;
  });

  await notifyByEmail({
    email: booking.customer.email,
    title: wasPreApproval ? "Booking rejected" : "Booking cancelled",
    message:
      refundAmount > 0
        ? `Your booking has been ${wasPreApproval ? "rejected" : "cancelled"}. A refund of ₹${(refundAmount / 100).toLocaleString("en-IN")} has been initiated and should reflect in 5-7 business days.`
        : `Your booking has been ${wasPreApproval ? "rejected" : "cancelled"}.`,
  });

  return NextResponse.json({ booking: updated, refundAmount, totalWalks, remainingScheduledWalks });
}
