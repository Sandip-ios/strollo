import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = requireAuth();
  if (error) return error;

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: updated });
}
