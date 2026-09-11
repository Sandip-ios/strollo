import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { addressSchema } from "@/modules/addresses/address.schema";
import {
  resolveServiceArea,
  NOT_SERVICEABLE_MESSAGE,
  notifyAdminsOfUnservedAreaRequest,
  getServiceAreaIdsWithActiveWalker,
} from "@/lib/service-area";

export async function GET() {
  const { session, error } = requireCustomer();
  if (error) return error;

  const [addresses, walkerAreaIds] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.userId, deletedAt: null },
      include: { serviceArea: { select: { name: true } } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getServiceAreaIdsWithActiveWalker(),
  ]);

  const enriched = addresses.map((a) => ({
    ...a,
    area: a.serviceArea?.name ?? null,
    walkerAvailable: Boolean(a.serviceAreaId && walkerAreaIds.has(a.serviceAreaId)),
  }));

  return NextResponse.json({ addresses: enriched });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const coverage = await resolveServiceArea(data.serviceAreaId);
  if (!coverage.serviceable) {
    await notifyAdminsOfUnservedAreaRequest({ userId: session.userId, cityName: data.city });
    return NextResponse.json({ error: NOT_SERVICEABLE_MESSAGE }, { status: 422 });
  }

  // First address for a user is always the default, regardless of what
  // was passed in — a customer should never end up with zero default.
  const existingCount = await prisma.address.count({
    where: { userId: session.userId, deletedAt: null },
  });
  const shouldBeDefault = existingCount === 0 || data.isDefault === true;

  if (shouldBeDefault) {
    await prisma.address.updateMany({
      where: { userId: session.userId, deletedAt: null },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: session.userId,
      houseNumber: data.houseNumber,
      label: data.label,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: shouldBeDefault,
      serviceAreaId: coverage.serviceAreaId,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}
