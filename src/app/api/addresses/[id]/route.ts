import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { addressSchema } from "@/modules/addresses/address.schema";
import { resolveServiceArea, NOT_SERVICEABLE_MESSAGE } from "@/lib/service-area";

async function assertOwnership(addressId: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.deletedAt || address.userId !== userId) {
    return null;
  }
  return address;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

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

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.userId, deletedAt: null, NOT: { id: params.id } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: params.id },
    data: {
      houseNumber: data.houseNumber,
      label: data.label,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault ?? existing.isDefault,
      serviceAreaId: coverage.serviceAreaId,
    },
  });

  return NextResponse.json({ address });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await prisma.address.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  // If the deleted address was the default, promote the most recently
  // created remaining address so there's always exactly one default.
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: session.userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ success: true });
}
