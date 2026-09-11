import { prisma } from "@/lib/prisma";
import { generateWalkDates } from "@/lib/constants";
import { notifyByEmail, sendEmail, emailShell, ADMIN_NOTIFICATION_EMAILS } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice";
import { APP_URL } from "@/lib/app-url";

type ConfirmResult =
  | { ok: true; alreadyConfirmed: boolean; walksScheduled: number }
  | { ok: false; error: string };

// Shared by both the client-side payment verification endpoint
// (/api/bookings/[id]/verify, driven by Razorpay's checkout success
// callback) and the Razorpay webhook (/api/webhooks/razorpay). Whichever
// fires first wins; the other becomes a no-op via the PENDING_PAYMENT
// re-check inside the transaction — so it's safe, and expected, for both
// to call this for the same booking.
export async function confirmBookingPayment(params: {
  bookingId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
}): Promise<ConfirmResult> {
  const { bookingId, razorpayPaymentId, razorpaySignature } = params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, customer: true },
  });

  if (!booking || booking.deletedAt || !booking.payment) {
    return { ok: false, error: "Booking or payment not found" };
  }

  if (booking.status !== "PENDING_PAYMENT") {
    return { ok: true, alreadyConfirmed: true, walksScheduled: 0 };
  }

  const walkDates = generateWalkDates(booking.startDate, booking.endDate);

  const result = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction to close the race window between the
    // read above and this write — the client callback and the webhook can
    // both reach here concurrently for the same booking.
    const fresh = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!fresh || fresh.status !== "PENDING_PAYMENT") {
      return null;
    }

    await tx.payment.update({
      where: { id: booking.payment!.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId,
        ...(razorpaySignature ? { razorpaySignature } : {}),
      },
    });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    await tx.walkInstance.createMany({
      data: walkDates.map((date) => ({
        bookingId,
        scheduledDate: date,
        status: "SCHEDULED" as const,
      })),
    });

    // Finalize the carry-forward credit this booking's duration was
    // extended by (computed at creation time — re-check what's still
    // unclaimed now, in case some was claimed elsewhere in the meantime).
    if (booking.carriedOverDays > 0) {
      const claimable = await tx.walkInstance.findMany({
        where: {
          status: "CANCELLED",
          carriedForward: false,
          booking: { customerId: booking.customerId, deletedAt: null },
        },
        orderBy: { cancelledAt: "asc" },
        take: booking.carriedOverDays,
        select: { id: true },
      });
      if (claimable.length > 0) {
        await tx.walkInstance.updateMany({
          where: { id: { in: claimable.map((w) => w.id) } },
          data: { carriedForward: true },
        });
      }
    }

    const admins = await tx.user.findMany({ where: { role: "ADMIN", deletedAt: null } });

    await tx.notification.createMany({
      data: [
        {
          userId: booking.customerId,
          type: "BOOKING_CONFIRMED",
          title: "Booking confirmed",
          message:
            `Your payment was successful — your booking is confirmed with ${walkDates.length} walks scheduled. A walker will be assigned shortly.` +
            (booking.carriedOverDays > 0
              ? ` Includes ${booking.carriedOverDays} extra day${booking.carriedOverDays === 1 ? "" : "s"} carried forward from cancelled walks.`
              : ""),
        },
        // Every admin gets alerted so a new booking never sits unnoticed —
        // tapping it takes them straight to the booking to assign a walker.
        ...admins.map((admin) => ({
          userId: admin.id,
          type: "BOOKING_CONFIRMED" as const,
          title: "New booking",
          message: `${booking.customer.name ?? booking.customer.mobileNumber} booked ${walkDates.length} walks. It needs a walker assigned.`,
          link: `/admin/bookings/${booking.id}`,
        })),
      ],
    });

    return updatedBooking;
  });

  if (!result) {
    return { ok: true, alreadyConfirmed: true, walksScheduled: 0 };
  }

  // The receipt PDF needs the payment row already marked SUCCESS, which
  // just happened inside the transaction above — safe to generate now.
  const invoice = await generateInvoicePdf(bookingId);

  const appUrl = APP_URL;

  await notifyByEmail({
    email: booking.customer.email,
    title: "Booking & payment confirmed",
    message: `Your payment was successful and your booking is confirmed with ${walkDates.length} walks scheduled. A walker will be assigned shortly. Your receipt is attached.`,
    cta: { label: "View your booking", url: `${appUrl}/bookings/${booking.id}` },
    attachments: invoice ? [{ filename: invoice.filename, content: invoice.buffer, contentType: "application/pdf" }] : undefined,
  });

  await sendEmail({
    to: ADMIN_NOTIFICATION_EMAILS.join(", "),
    subject: "New booking received",
    html: emailShell(
      "New booking received",
      `${booking.customer.name ?? booking.customer.mobileNumber} (${booking.customer.mobileNumber}) booked ${walkDates.length} walks. It needs a walker assigned.`,
      { label: "Assign a walker", url: `${appUrl}/admin/bookings/${booking.id}` }
    ),
    attachments: invoice ? [{ filename: invoice.filename, content: invoice.buffer, contentType: "application/pdf" }] : undefined,
  });

  return { ok: true, alreadyConfirmed: false, walksScheduled: walkDates.length };
}
