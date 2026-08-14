import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";

export async function GET() {
  const { session, error } = requireWalker();
  if (error) return error;

  const walker = await prisma.walker.findFirst({
    where: { userId: session.userId, deletedAt: null },
  });
  if (!walker) {
    return NextResponse.json({ error: "Walker profile not found" }, { status: 404 });
  }

  const walks = await prisma.walkInstance.findMany({
    where: { walkerId: walker.id },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, mobileNumber: true } },
          address: true,
          bookingDogs: { include: { dog: true } },
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json({ walks, walker });
}
