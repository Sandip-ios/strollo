import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { notifyByEmail } from "@/lib/email";
import { z } from "zod";

const assignSchema = z.object({
  walkerId: z.string().min(1, "Select a walker"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { walker: true, customer: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!["APPROVED", "WALKER_ASSIGNED", "ACTIVE"].includes(booking.status)) {
    return NextResponse.json(
      {
        error:
          booking.status === "CONFIRMED"
            ? "Approve this booking before assigning a walker."
            : "This booking isn't ready for walker assignment",
      },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const walker = await prisma.walker.findFirst({
    where: { id: parsed.data.walkerId, deletedAt: null, isActive: true },
  });
  if (!walker) {
    return NextResponse.json({ error: "Walker not found or inactive" }, { status: 404 });
  }

  const isReassignment = Boolean(booking.walkerId) && booking.walkerId !== walker.id;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        walkerId: walker.id,
        status: booking.status === "APPROVED" ? "WALKER_ASSIGNED" : booking.status,
      },
    });

    // Only propagate to walks that haven't happened yet — don't rewrite
    // history on already-completed or in-progress walk records.
    await tx.walkInstance.updateMany({
      where: { bookingId: booking.id, status: "SCHEDULED" },
      data: { walkerId: walker.id },
    });

    await tx.notification.create({
      data: {
        userId: booking.customerId,
        type: "WALKER_ASSIGNED",
        title: isReassignment ? "Walker reassigned" : "Walker assigned",
        message: `${walker.name} has been ${isReassignment ? "reassigned as" : "assigned as"} your dog's walker.`,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: session.userId,
        action: isReassignment ? "WALKER_REASSIGNED" : "WALKER_ASSIGNED",
        entityType: "Booking",
        entityId: booking.id,
        metadata: {
          walkerId: walker.id,
          walkerName: walker.name,
          previousWalkerId: booking.walkerId,
        },
      },
    });

    return updatedBooking;
  });

  await notifyByEmail({
    email: booking.customer.email,
    title: isReassignment ? "Walker reassigned" : "Walker assigned",
    message: `${walker.name} has been ${isReassignment ? "reassigned as" : "assigned as"} your dog's walker.`,
  });

  return NextResponse.json({ booking: updated });
}
