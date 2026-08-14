import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      // Payment-pending bookings are abandoned carts, not real bookings —
      // admin doesn't need to act on those.
      status: { not: "PENDING_PAYMENT" },
    },
    include: {
      customer: { select: { id: true, name: true, mobileNumber: true } },
      plan: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
