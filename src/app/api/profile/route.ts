import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { updateProfileSchema } from "@/modules/profile/profile.schema";

export async function GET() {
  const { session, error } = requireCustomer();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, mobileNumber: true, role: true },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = requireCustomer();
  if (error) return error;

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
    },
    select: { id: true, name: true, email: true, mobileNumber: true, role: true },
  });

  return NextResponse.json({ user });
}
