import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";

export async function GET() {
  const { error } = requireAuth();
  if (error) return error;

  const [cities, serviceAreas] = await Promise.all([
    prisma.city.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.serviceArea.findMany({
      where: { deletedAt: null, isActive: true, city: { deletedAt: null, isActive: true } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, cityId: true },
    }),
  ]);

  return NextResponse.json({ cities, serviceAreas });
}
