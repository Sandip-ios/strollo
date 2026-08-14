import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { addressSchema } from "@/modules/addresses/address.schema";
import { resolveServiceArea, NOT_SERVICEABLE_MESSAGE } from "@/lib/service-area";

export async function GET() {
  const { session, error } = requireCustomer();
  if (error) return error;

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
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

  const coverage = await resolveServiceArea(data.pincode);
  if (!coverage.serviceable) {
    return NextResponse.json({ error: NOT_SERVICEABLE_MESSAGE(data.pincode) }, { status: 422 });
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
