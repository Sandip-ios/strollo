import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { dogSchema } from "@/modules/dogs/dog.schema";

export async function GET() {
  const { session, error } = requireCustomer();
  if (error) return error;

  const dogs = await prisma.dog.findMany({
    where: { userId: session.userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ dogs });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const body = await req.json();
  const parsed = dogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const dog = await prisma.dog.create({
    data: {
      userId: session.userId,
      name: data.name,
      breed: data.breed,
      size: data.size,
      age: data.age,
      weightKg: data.weightKg,
      gender: data.gender,
      vaccinations: data.vaccinations,
      temperament: data.temperament,
      isRegisteredWithAMC: data.isRegisteredWithAMC,
      amcRegistrationNumber: data.isRegisteredWithAMC ? data.amcRegistrationNumber || null : null,
      medicalNotes: data.medicalNotes || null,
      behaviourNotes: data.behaviourNotes || null,
      photoUrl: data.photoUrl || null,
    },
  });

  return NextResponse.json({ dog }, { status: 201 });
}
