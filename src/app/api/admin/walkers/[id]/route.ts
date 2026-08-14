import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { walkerSchema } from "@/modules/admin/walker.schema";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.walker.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Walker not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = walkerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const walker = await prisma.walker.update({
    where: { id: params.id },
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

  if (existing.isActive !== data.isActive) {
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: data.isActive ? "WALKER_ACTIVATED" : "WALKER_DEACTIVATED",
        entityType: "Walker",
        entityId: walker.id,
        metadata: { name: walker.name },
      },
    });
  }

  return NextResponse.json({ walker });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.walker.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Walker not found" }, { status: 404 });
  }

  await prisma.walker.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "WALKER_REMOVED",
      entityType: "Walker",
      entityId: params.id,
      metadata: { name: existing.name },
    },
  });

  return NextResponse.json({ success: true });
}
