import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = requireWalker();
  if (error) return error;

  const walker = await prisma.walker.findFirst({
    where: { userId: session.userId, deletedAt: null },
  });
  if (!walker) {
    return NextResponse.json({ error: "Walker profile not found" }, { status: 404 });
  }

  const walk = await prisma.walkInstance.findFirst({
    where: { id: params.id, walkerId: walker.id },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, mobileNumber: true } },
          address: true,
          bookingDogs: { include: { dog: true } },
        },
      },
      photos: true,
    },
  });

  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  return NextResponse.json({ walk });
}
