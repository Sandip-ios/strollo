import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { serviceAreaSchema } from "@/modules/admin/service-area.schema";

export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;

  const serviceAreasRaw = await prisma.serviceArea.findMany({
    where: { deletedAt: null },
    include: { city: true, _count: { select: { walkers: { where: { isActive: true, deletedAt: null } } } } },
    orderBy: { createdAt: "desc" },
  });

  const serviceAreas = serviceAreasRaw.map((a) => ({
    id: a.id,
    name: a.name,
    cityId: a.cityId,
    city: a.city,
    isActive: a.isActive,
    walkerCount: a._count.walkers,
  }));

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

  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city || city.deletedAt) {
    return NextResponse.json({ error: "Select a valid city" }, { status: 400 });
  }

  const serviceArea = await prisma.serviceArea.create({
    data: {
      name: data.name,
      cityId: data.cityId,
      isActive: data.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "SERVICE_AREA_CREATED",
      entityType: "ServiceArea",
      entityId: serviceArea.id,
      metadata: { name: serviceArea.name, city: city.name },
    },
  });

  return NextResponse.json({ serviceArea }, { status: 201 });
}
