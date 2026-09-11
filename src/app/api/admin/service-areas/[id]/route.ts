import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { serviceAreaSchema } from "@/modules/admin/service-area.schema";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.serviceArea.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Service area not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = serviceAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city || city.deletedAt) {
    return NextResponse.json({ error: "Select a valid city" }, { status: 400 });
  }

  const serviceArea = await prisma.serviceArea.update({
    where: { id: params.id },
    data: {
      name: data.name,
      cityId: data.cityId,
      isActive: data.isActive,
    },
  });

  if (existing.isActive !== data.isActive) {
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: data.isActive ? "SERVICE_AREA_ACTIVATED" : "SERVICE_AREA_DEACTIVATED",
        entityType: "ServiceArea",
        entityId: serviceArea.id,
        metadata: { name: serviceArea.name },
      },
    });
  }

  return NextResponse.json({ serviceArea });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.serviceArea.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Service area not found" }, { status: 404 });
  }

  await prisma.serviceArea.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "SERVICE_AREA_REMOVED",
      entityType: "ServiceArea",
      entityId: params.id,
      metadata: { name: existing.name },
    },
  });

  return NextResponse.json({ success: true });
}
