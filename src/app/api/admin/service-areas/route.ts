import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { serviceAreaSchema } from "@/modules/admin/service-area.schema";

export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;

  const serviceAreas = await prisma.serviceArea.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ serviceAreas });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = serviceAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const serviceArea = await prisma.serviceArea.create({
    data: {
      name: data.name,
      city: data.city,
      pincodes: data.pincodes,
      isActive: data.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "SERVICE_AREA_CREATED",
      entityType: "ServiceArea",
      entityId: serviceArea.id,
      metadata: { name: serviceArea.name, city: serviceArea.city, pincodes: serviceArea.pincodes },
    },
  });

  return NextResponse.json({ serviceArea }, { status: 201 });
}
