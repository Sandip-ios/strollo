import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { z } from "zod";

const photoSchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireAdmin();
  if (error) return error;

  const walk = await prisma.walkInstance.findUnique({ where: { id: params.id } });
  if (!walk) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
  }

  const photo = await prisma.walkPhoto.create({
    data: { walkInstanceId: walk.id, url: parsed.data.url },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
