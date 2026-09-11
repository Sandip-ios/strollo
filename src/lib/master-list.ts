import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

type MasterItem = { id: string; name: string; isActive: boolean; deletedAt: Date | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MasterDelegate = {
  findMany: (args: any) => Promise<MasterItem[]>;
  findUnique: (args: any) => Promise<MasterItem | null>;
  create: (args: any) => Promise<MasterItem>;
  update: (args: any) => Promise<MasterItem>;
};

const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  isActive: z.boolean().default(true),
});

// Breed, Temperament, and VaccinationType are all a plain name + isActive
// lookup list, so one factory produces both route handler pairs for all
// three instead of duplicating the same CRUD logic per model.
export function masterListRoutes(delegate: MasterDelegate, label: string, actionPrefix: string) {
  async function GET() {
    const { error } = requireAdmin();
    if (error) return error;

    const items = await delegate.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
    return NextResponse.json({ items });
  }

  async function POST(req: NextRequest) {
    const { session, error } = requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const item = await delegate.create({ data: parsed.data });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: `${actionPrefix}_CREATED`,
        entityType: label,
        entityId: item.id,
        metadata: { name: item.name },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  }

  return { GET, POST };
}

export function masterListItemRoutes(delegate: MasterDelegate, label: string, actionPrefix: string) {
  async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const { session, error } = requireAdmin();
    if (error) return error;

    const existing = await delegate.findUnique({ where: { id: params.id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: `${label} not found` }, { status: 404 });
    }

    const body = await req.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const item = await delegate.update({ where: { id: params.id }, data: parsed.data });

    if (existing.isActive !== parsed.data.isActive) {
      await prisma.auditLog.create({
        data: {
          adminId: session.userId,
          action: parsed.data.isActive ? `${actionPrefix}_ACTIVATED` : `${actionPrefix}_DEACTIVATED`,
          entityType: label,
          entityId: item.id,
          metadata: { name: item.name },
        },
      });
    }

    return NextResponse.json({ item });
  }

  async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const { session, error } = requireAdmin();
    if (error) return error;

    const existing = await delegate.findUnique({ where: { id: params.id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: `${label} not found` }, { status: 404 });
    }

    await delegate.update({ where: { id: params.id }, data: { deletedAt: new Date(), isActive: false } });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: `${actionPrefix}_REMOVED`,
        entityType: label,
        entityId: params.id,
        metadata: { name: existing.name },
      },
    });

    return NextResponse.json({ success: true });
  }

  return { PATCH, DELETE };
}
