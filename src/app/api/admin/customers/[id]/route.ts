import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { z } from "zod";

const updateCustomerSchema = z.object({
  isActive: z.boolean(),
});

// Only status toggling — customers manage their own name/email/mobile via
// their own profile page. Deactivating blocks login (see
// /api/auth/otp/request, which already gates on `isActive`).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const customer = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: parsed.data.isActive },
  });

  if (existing.isActive !== parsed.data.isActive) {
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: parsed.data.isActive ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
        entityType: "User",
        entityId: customer.id,
        metadata: { name: customer.name, mobileNumber: customer.mobileNumber },
      },
    });
  }

  return NextResponse.json({ customer });
}
