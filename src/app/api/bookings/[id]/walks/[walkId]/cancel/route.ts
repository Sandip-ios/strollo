import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { canCancelWalk, CANCELLATION_LEAD_HOURS } from "@/lib/constants";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; walkId: string } }
) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, customerId: session.userId, deletedAt: null },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const walk = await prisma.walkInstance.findFirst({
    where: { id: params.walkId, bookingId: booking.id },
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  if (walk.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Only an upcoming, scheduled walk can be cancelled." },
      { status: 409 }
    );
  }

  if (!canCancelWalk(walk.scheduledDate, booking.slot)) {
    return NextResponse.json(
      {
        error: `Walks can only be cancelled at least ${CANCELLATION_LEAD_HOURS} hours before the slot starts.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.walkInstance.update({
    where: { id: walk.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return NextResponse.json({ walk: updated });
}
