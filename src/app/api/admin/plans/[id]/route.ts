import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { updatePlanSchema } from "@/modules/admin/plan.schema";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const newPricePaise = Math.round(data.priceRupees * 100);

  const plan = await prisma.plan.update({
    where: { id: params.id },
    data: {
      name: data.name,
      price: newPricePaise,
      dogQuantity: data.dogQuantity,
      isActive: data.isActive,
    },
  });

  // Audit trail for price changes specifically — this is the kind of
  // change that customers and support will ask "when did this change"
  // about, so it's worth its own action name rather than a generic UPDATE.
  if (existing.price !== newPricePaise) {
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: "PLAN_PRICE_UPDATED",
        entityType: "Plan",
        entityId: plan.id,
        metadata: { from: existing.price, to: newPricePaise, planType: plan.type },
      },
    });
  }

  if (existing.isActive !== data.isActive) {
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: data.isActive ? "PLAN_ACTIVATED" : "PLAN_DEACTIVATED",
        entityType: "Plan",
        entityId: plan.id,
        metadata: { planType: plan.type },
      },
    });
  }

  return NextResponse.json({ plan });
}

// Only CUSTOM plans can be removed — MONTHLY/WEEKLY are the fixed core
// plans and always keep exactly one slot each on the admin page.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const existing = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (existing.type !== "CUSTOM") {
    return NextResponse.json(
      { error: "Only custom plans can be removed" },
      { status: 400 }
    );
  }

  await prisma.plan.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "PLAN_REMOVED",
      entityType: "Plan",
      entityId: params.id,
      metadata: { name: existing.name, type: existing.type },
    },
  });

  return NextResponse.json({ success: true });
}
