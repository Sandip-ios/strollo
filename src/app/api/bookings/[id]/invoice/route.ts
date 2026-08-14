import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { WALK_SLOTS } from "@/lib/constants";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = requireAuth();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      customer: true,
      plan: true,
      address: true,
      bookingDogs: { include: { dog: true } },
      payment: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (session.role !== "ADMIN" && booking.customerId !== session.userId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!booking.payment || !["SUCCESS", "REFUNDED"].includes(booking.payment.status)) {
    return NextResponse.json(
      { error: "No successful payment found for this booking yet" },
      { status: 409 }
    );
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="strollo-receipt-${booking.id}.pdf"`,
    },
  });
}
