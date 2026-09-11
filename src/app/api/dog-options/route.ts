import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";

export async function GET() {
  const { error } = requireAuth();
  if (error) return error;

  const [breeds, temperaments, vaccinationTypes] = await Promise.all([
    prisma.breed.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.temperament.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.vaccinationType.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return NextResponse.json({
    breeds: breeds.map((b) => b.name),
    temperaments: temperaments.map((t) => t.name),
    vaccinationTypes: vaccinationTypes.map((v) => v.name),
  });
}
