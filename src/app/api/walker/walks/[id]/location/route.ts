import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";
import { z } from "zod";
import type { RoutePoint } from "@/lib/geo";

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  ts: z.number(),
});

// Called periodically by the walker's device while a walk is ON_GOING, so
// the customer can see roughly where the walk is happening right now
// instead of only finding out the full route after it's done. The
// complete-walk endpoint still writes the authoritative final routePath —
// this just keeps it updated live in between.
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
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
  if (walk.status !== "ON_GOING") {
    return NextResponse.json({ error: "This walk isn't in progress" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid location" },
      { status: 400 }
    );
  }

  const existing = ((walk.routePath as unknown as RoutePoint[] | null) ?? []).slice(-1999);
  const routePath = [...existing, parsed.data];

  await prisma.walkInstance.update({
    where: { id: walk.id },
    data: { routePath },
  });

  return NextResponse.json({ success: true, pointCount: routePath.length });
}
