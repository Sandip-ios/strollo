import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWalker } from "@/lib/guards";
import { z } from "zod";

const eventSchema = z.object({
  type: z.enum(["PEE", "POO", "DRANK_WATER", "HAPPY", "RESTED", "OTHER"]),
  note: z.string().max(300).optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
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
  });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
  if (walk.status !== "ON_GOING") {
    return NextResponse.json({ error: "Start the walk before logging an event" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [event] = await prisma.$transaction([
    prisma.walkEvent.create({
      data: {
        walkInstanceId: walk.id,
        type: data.type,
        note: data.note || null,
        photoUrl: data.photoUrl || null,
      },
    }),
    // Keep the legacy summary flags in sync so anything still reading
    // them directly (admin's manual walk edit, older completed walks)
    // stays consistent with what actually happened on the walk.
    ...(data.type === "PEE" ? [prisma.walkInstance.update({ where: { id: walk.id }, data: { peeUpdate: true } })] : []),
    ...(data.type === "POO" ? [prisma.walkInstance.update({ where: { id: walk.id }, data: { pooUpdate: true } })] : []),
  ]);

  return NextResponse.json({ event }, { status: 201 });
}
