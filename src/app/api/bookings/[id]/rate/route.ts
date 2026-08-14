import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { rateWalkerSchema } from "@/modules/bookings/booking.schema";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, customerId: session.userId, deletedAt: null },
    include: { rating: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!booking.walkerId) {
    return NextResponse.json({ error: "No walker was assigned on this booking." }, { status: 409 });
  }
  if (booking.rating) {
    return NextResponse.json({ error: "You've already rated this subscription." }, { status: 409 });
  }
  if (new Date() < booking.endDate && booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Ratings open once your subscription period is complete." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = rateWalkerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const rating = await prisma.walkerRating.create({
    data: {
      bookingId: booking.id,
      walkerId: booking.walkerId,
      customerId: session.userId,
      score: parsed.data.score,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ rating }, { status: 201 });
}
