import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { walkerSchema } from "@/modules/admin/walker.schema";

export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;

  const walkers = await prisma.walker.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ walkers });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = walkerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.walker.findUnique({ where: { mobileNumber: data.mobileNumber } });
  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { error: "A walker with this mobile number already exists" },
      { status: 409 }
    );
  }

  const walker = await prisma.walker.create({
    data: {
      name: data.name,
      mobileNumber: data.mobileNumber,
      photoUrl: data.photoUrl || null,
      area: data.area,
      govIdType: data.govIdType || null,
      govIdNumber: data.govIdNumber || null,
      govIdPhotoUrl: data.govIdPhotoUrl || null,
      notes: data.notes || null,
      isActive: data.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "WALKER_CREATED",
      entityType: "Walker",
      entityId: walker.id,
      metadata: { name: walker.name, mobileNumber: walker.mobileNumber },
    },
  });

  return NextResponse.json({ walker }, { status: 201 });
}
