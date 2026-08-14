import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import type { RoutePoint } from "@/lib/geo";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; walkId: string } }
) {
  const { session, error } = requireAuth();
  if (error) return error;

  const walk = await prisma.walkInstance.findFirst({
    where: { id: params.walkId, bookingId: params.id },
    include: { booking: true },
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
  if (session.role !== "ADMIN" && walk.booking.customerId !== session.userId) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  const points = (walk.routePath as unknown as RoutePoint[] | null) ?? [];
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return NextResponse.json({
    status: walk.status,
    startTime: walk.startTime,
    pointCount: points.length,
    lastPoint,
  });
}
