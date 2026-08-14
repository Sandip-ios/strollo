import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { updateWalkSchema } from "@/modules/admin/walk.schema";
import { notifyByEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const walk = await prisma.walkInstance.findUnique({
    where: { id: params.id },
    include: { booking: { include: { customer: true } } },
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateWalkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const previousStatus = walk.status;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedWalk = await tx.walkInstance.update({
      where: { id: walk.id },
      data: {
        status: data.status,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        distanceMeters: data.distanceMeters ?? undefined,
        durationSec: data.durationSec ?? undefined,
        pooUpdate: data.pooUpdate ?? undefined,
        peeUpdate: data.peeUpdate ?? undefined,
        walkerNotes: data.walkerNotes || undefined,
      },
    });

    // Notify the customer on meaningful transitions only, not every edit.
    if (previousStatus !== "ON_GOING" && data.status === "ON_GOING") {
      await tx.notification.create({
        data: {
          userId: walk.booking.customerId,
          type: "WALK_STARTED",
          title: "Walk started",
          message: "Your walker has started today's walk.",
        },
      });
    }
    if (previousStatus !== "COMPLETED" && data.status === "COMPLETED") {
      await tx.notification.create({
        data: {
          userId: walk.booking.customerId,
          type: "WALK_COMPLETED",
          title: "Walk completed",
          message: "Today's walk is complete. Check the timeline for details.",
        },
      });
    }

    // Cascade booking status: once a walk has started, the booking is
    // "active"; once every walk is resolved (completed or missed), the
    // booking is "completed" — no walk left to act on.
    const allWalks = await tx.walkInstance.findMany({ where: { bookingId: walk.bookingId } });
    const anyOngoing = allWalks.some((w) => w.id === walk.id ? data.status === "ON_GOING" : w.status === "ON_GOING");
    const allResolved = allWalks.every((w) =>
      w.id === walk.id
        ? data.status === "COMPLETED" || data.status === "MISSED"
        : w.status === "COMPLETED" || w.status === "MISSED"
    );

    if (allResolved && walk.booking.status !== "COMPLETED") {
      await tx.booking.update({ where: { id: walk.bookingId }, data: { status: "COMPLETED" } });
    } else if (anyOngoing && walk.booking.status === "WALKER_ASSIGNED") {
      await tx.booking.update({ where: { id: walk.bookingId }, data: { status: "ACTIVE" } });
    }

    await tx.auditLog.create({
      data: {
        adminId: session.userId,
        action: "WALK_UPDATED",
        entityType: "WalkInstance",
        entityId: walk.id,
        metadata: { from: previousStatus, to: data.status },
      },
    });

    return updatedWalk;
  });

  if (previousStatus !== "ON_GOING" && data.status === "ON_GOING") {
    await notifyByEmail({
      email: walk.booking.customer.email,
      title: "Walk started",
      message: "Your walker has started today's walk.",
    });
  }
  if (previousStatus !== "COMPLETED" && data.status === "COMPLETED") {
    await notifyByEmail({
      email: walk.booking.customer.email,
      title: "Walk completed",
      message: "Today's walk is complete. Check the timeline for details.",
    });
  }

  return NextResponse.json({ walk: updated });
}
