import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, customerId: session.userId, deletedAt: null },
    include: {
      plan: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: { orderBy: { scheduledDate: "asc" } },
      payment: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
