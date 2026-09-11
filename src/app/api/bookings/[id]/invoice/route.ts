import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { generateInvoicePdf } from "@/lib/invoice";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = requireAuth();
  if (error) return error;

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, deletedAt: null },
    select: { id: true, customerId: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (session.role !== "ADMIN" && booking.customerId !== session.userId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const invoice = await generateInvoicePdf(booking.id);
  if (!invoice) {
    return NextResponse.json(
      { error: "No successful payment found for this booking yet" },
      { status: 409 }
    );
  }

  return new NextResponse(new Uint8Array(invoice.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.filename}"`,
    },
  });
}
