import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { verifyPaymentSchema } from "@/modules/bookings/booking.schema";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { confirmBookingPayment } from "@/lib/booking-confirmation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { payment: true, customer: true },
  });

  if (!booking || booking.customerId !== session.userId || booking.deletedAt) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!booking.payment) {
    return NextResponse.json({ error: "No payment found for this booking" }, { status: 400 });
  }
  if (booking.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "This booking has already been processed" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (razorpay_order_id !== booking.payment.razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { status: "FAILED", razorpayPaymentId: razorpay_payment_id },
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const result = await confirmBookingPayment({
    bookingId: booking.id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });

  return NextResponse.json({ booking: updatedBooking, walksScheduled: result.walksScheduled });
}
