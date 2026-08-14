import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";
import { computeRouteDistanceMeters } from "@/lib/geo";
import { notifyByEmail } from "@/lib/email";
import { z } from "zod";

const routePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  ts: z.number(),
});

const completeSchema = z.object({
  walkerNotes: z.string().max(500).optional().or(z.literal("")),
  pooUpdate: z.boolean().optional(),
  peeUpdate: z.boolean().optional(),
  photoUrls: z.array(z.string().url()).max(6).optional(),
  // Capped generously above what a real 30-minute walk would ever produce —
  // just a guard against a malformed/abusive payload, not a tuning knob.
  routePath: z.array(routePointSchema).max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  if (walk.status !== "ON_GOING") {
    return NextResponse.json({ error: "Start the walk before completing it" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const startTime = walk.startTime ?? new Date();
  const endTime = new Date();
  const durationSec = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

  // Route points are supplied by the walker's device, but the distance
  // derived from them is computed here — never trust a client-sent number
  // as the recorded value.
  const routePath = data.routePath?.length ? data.routePath : undefined;
  const distanceMeters = routePath ? computeRouteDistanceMeters(routePath) : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedWalk = await tx.walkInstance.update({
      where: { id: walk.id },
      data: {
        status: "COMPLETED",
        endTime,
        durationSec,
        walkerNotes: data.walkerNotes || null,
        pooUpdate: data.pooUpdate ?? null,
        peeUpdate: data.peeUpdate ?? null,
        routePath: routePath ?? undefined,
        distanceMeters: distanceMeters ?? undefined,
      },
    });

    if (data.photoUrls?.length) {
      await tx.walkPhoto.createMany({
        data: data.photoUrls.map((url) => ({ walkInstanceId: walk.id, url })),
      });
    }

    await tx.notification.create({
      data: {
        userId: walk.booking.customerId,
        type: "WALK_COMPLETED",
        title: "Walk completed",
        message: `Today's walk is done — check the update from ${walker.name}.`,
      },
    });

    // If every walk in this booking is now finished (completed or missed),
    // the booking itself is done.
    const remaining = await tx.walkInstance.count({
      where: { bookingId: walk.bookingId, status: { in: ["SCHEDULED", "ON_GOING"] } },
    });
    if (remaining === 0) {
      await tx.booking.update({ where: { id: walk.bookingId }, data: { status: "COMPLETED" } });
    }

    return updatedWalk;
  });

  await notifyByEmail({
    email: walk.booking.customer.email,
    title: "Walk completed",
    message: `Today's walk is done — check the update from ${walker.name}.`,
  });

  return NextResponse.json({ walk: updated });
}
