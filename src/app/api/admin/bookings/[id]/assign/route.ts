import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { notifyByEmail } from "@/lib/email";
import { notifyByWhatsAppOrSms } from "@/lib/sms";
import { APP_URL } from "@/lib/app-url";
import { z } from "zod";

const assignSchema = z.object({
  walkerId: z.string().min(1, "Select a walker"),
});

// Accepts CONFIRMED too (not just APPROVED+) so a brand-new booking can be
// approved and given a walker in one action — the "instant assign" path
// from the admin dashboard's new-bookings alert, instead of forcing two
// separate steps for every fresh booking.
const ASSIGNABLE_STATUSES = ["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"] as const;

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
  if (!ASSIGNABLE_STATUSES.includes(booking.status as (typeof ASSIGNABLE_STATUSES)[number])) {
    return NextResponse.json({ error: "This booking isn't ready for walker assignment" }, { status: 409 });
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
    include: { user: true },
  });
  if (!walker) {
    return NextResponse.json({ error: "Walker not found or inactive" }, { status: 404 });
  }

  const wasAwaitingApproval = booking.status === "CONFIRMED";
  const isReassignment = Boolean(booking.walkerId) && booking.walkerId !== walker.id;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        walkerId: walker.id,
        status: booking.status === "APPROVED" || booking.status === "CONFIRMED" ? "WALKER_ASSIGNED" : booking.status,
      },
    });

    // Only propagate to walks that haven't happened yet — don't rewrite
    // history on already-completed or in-progress walk records.
    await tx.walkInstance.updateMany({
      where: { bookingId: booking.id, status: "SCHEDULED" },
      data: { walkerId: walker.id },
    });

    if (wasAwaitingApproval) {
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          type: "BOOKING_APPROVED",
          title: "Booking approved",
          message: "Your booking has been approved.",
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
    }

    await tx.notification.create({
      data: {
        userId: booking.customerId,
        type: "WALKER_ASSIGNED",
        title: isReassignment ? "Walker reassigned" : "Walker assigned",
        message: `${walker.name} has been ${isReassignment ? "reassigned as" : "assigned as"} your dog's walker.`,
      },
    });

    // Let the walker know too, if they have a login — otherwise they'll
    // just see it appear in their walk list.
    if (walker.userId) {
      await tx.notification.create({
        data: {
          userId: walker.userId,
          type: "WALKER_ASSIGNED",
          title: isReassignment ? "Walk reassigned to you" : "New walk assigned to you",
          message: `You've been ${isReassignment ? "reassigned" : "assigned"} a walk for ${booking.customer.name ?? booking.customer.mobileNumber}'s dog.`,
        },
      });
    }

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

  const appUrl = APP_URL;
  const walkerCustomerName = booking.customer.name ?? booking.customer.mobileNumber;
  const walkerMessage = `You've been ${isReassignment ? "reassigned" : "assigned"} a walk for ${walkerCustomerName}'s dog. Check your dashboard for details.`;

  await notifyByEmail({
    email: walker.user?.email,
    title: isReassignment ? "Walk reassigned to you" : "New walk assigned to you",
    message: walkerMessage,
    cta: { label: "View your walks", url: `${appUrl}/walker` },
  });

  await notifyByWhatsAppOrSms({
    to: walker.mobileNumber,
    message: `Strollo: ${walkerMessage} ${appUrl}/walker`,
  });

  return NextResponse.json({ booking: updated });
}
