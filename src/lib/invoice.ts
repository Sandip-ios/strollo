import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { WALK_SLOTS } from "@/lib/constants";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";

// Shared by the customer-facing download route and the booking-confirmation
// email (which attaches the same PDF) — one place that knows how to turn a
// paid booking into a receipt, so the two never drift apart.
export async function generateInvoicePdf(
  bookingId: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: {
      customer: true,
      plan: true,
      address: true,
      bookingDogs: { include: { dog: true } },
      payment: true,
    },
  });

  if (!booking || !booking.payment || !["SUCCESS", "REFUNDED"].includes(booking.payment.status)) {
    return null;
  }

  const slotLabel = WALK_SLOTS.find((s) => s.value === booking.slot)?.label ?? booking.slot;
  const invoiceNumber = `STR-${booking.payment.id.slice(-8).toUpperCase()}`;

  const buffer = await renderToBuffer(
    InvoiceDocument({
      data: {
        invoiceNumber,
        bookingId: booking.id,
        razorpayPaymentId: booking.payment.razorpayPaymentId,
        paidAt: booking.payment.updatedAt,
        customerName: booking.customer.name ?? booking.customer.mobileNumber,
        customerMobile: booking.customer.mobileNumber,
        customerState: booking.address.state,
        planName: booking.plan.name,
        dogNames: booking.bookingDogs.map((bd) => bd.dog.name),
        slotLabel,
        startDate: booking.startDate,
        endDate: booking.endDate,
        addressLine: `${booking.address.houseNumber}, ${booking.address.label}, ${booking.address.line1}, ${booking.address.city}`,
        amountPaise: booking.payment.amount,
      },
    })
  );

  return { buffer, filename: `strollo-receipt-${booking.id}.pdf` };
}
