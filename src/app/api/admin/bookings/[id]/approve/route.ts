import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { notifyByEmail } from "@/lib/email";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { customer: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Only a payment-confirmed booking awaiting approval can be approved" },
      { status: 409 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "APPROVED" },
    });

    await tx.notification.create({
      data: {
        userId: booking.customerId,
        type: "BOOKING_APPROVED",
        title: "Booking approved",
        message: "Your booking has been approved — a walker will be assigned shortly.",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: session.userId,
        action: "BOOKING_APPROVED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: {},
      },
    });

    return updatedBooking;
  });

  await notifyByEmail({
    email: booking.customer.email,
    title: "Booking approved",
    message: "Your booking has been approved — a walker will be assigned shortly.",
  });

  return NextResponse.json({ booking: updated });
}
