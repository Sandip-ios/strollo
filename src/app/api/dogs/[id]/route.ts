import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { dogSchema } from "@/modules/dogs/dog.schema";

async function assertOwnership(dogId: string, userId: string) {
  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog || dog.deletedAt || dog.userId !== userId) return null;
  return dog;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Dog not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = dogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const dog = await prisma.dog.update({
    where: { id: params.id },
    data: {
      name: data.name,
      breed: data.breed,
      size: data.size,
      age: data.age,
      weightKg: data.weightKg,
      gender: data.gender,
      isVaccinated: data.isVaccinated,
      isRabiesVaccinated: data.isRabiesVaccinated,
      temperament: data.temperament,
      isRegisteredWithAMC: data.isRegisteredWithAMC,
      amcRegistrationNumber: data.isRegisteredWithAMC ? data.amcRegistrationNumber || null : null,
      medicalNotes: data.medicalNotes || null,
      behaviourNotes: data.behaviourNotes || null,
      photoUrl: data.photoUrl || null,
    },
  });

  return NextResponse.json({ dog });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const existing = await assertOwnership(params.id, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Dog not found" }, { status: 404 });
  }

  await prisma.dog.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
