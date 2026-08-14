import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { createPlanSchema } from "@/modules/admin/plan.schema";

export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;

  const plans = await prisma.plan.findMany({
    where: { deletedAt: null },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const plan = await prisma.plan.create({
    data: {
      type: data.type,
      name: data.name,
      price: Math.round(data.priceRupees * 100),
      dogQuantity: data.dogQuantity,
      isActive: data.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      action: "PLAN_CREATED",
      entityType: "Plan",
      entityId: plan.id,
      metadata: {
        type: plan.type,
        name: plan.name,
        price: plan.price,
        dogQuantity: plan.dogQuantity,
      },
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
