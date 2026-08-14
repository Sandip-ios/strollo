import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";
import { notifyByEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
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
    include: { booking: { include: { customer: true } } },
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
  if (walk.status !== "SCHEDULED") {
    return NextResponse.json({ error: "This walk has already been started or completed" }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedWalk = await tx.walkInstance.update({
      where: { id: walk.id },
      data: { status: "ON_GOING", startTime: new Date() },
    });

    if (walk.booking.status === "WALKER_ASSIGNED") {
      await tx.booking.update({ where: { id: walk.booking.id }, data: { status: "ACTIVE" } });
    }

    await tx.notification.create({
      data: {
        userId: walk.booking.customerId,
        type: "WALK_STARTED",
        title: "Walk started",
        message: `${walker.name} has started today's walk.`,
      },
    });

    return updatedWalk;
  });

  await notifyByEmail({
    email: walk.booking.customer.email,
    title: "Walk started",
    message: `${walker.name} has started today's walk.`,
  });

  return NextResponse.json({ walk: updated });
}
