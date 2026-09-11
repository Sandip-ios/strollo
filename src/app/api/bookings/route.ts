import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/guards";
import { createBookingSchema } from "@/modules/bookings/booking.schema";
import { getPlanEndDate } from "@/lib/constants";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";
import { getServiceAreaIdsWithActiveWalker, NOT_SERVING_CITY_MESSAGE, NO_WALKER_AVAILABLE_MESSAGE } from "@/lib/service-area";
import { formatDate } from "@/lib/format-date";

const ACTIVE_BOOKING_STATUSES = ["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"] as const;

export async function GET() {
  const { session, error } = requireCustomer();
  if (error) return error;

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.userId, deletedAt: null },
    include: {
      plan: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: { orderBy: { scheduledDate: "asc" } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireCustomer();
  if (error) return error;

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add Razorpay credentials to .env." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { planId, addressId, dogIds, slot, startDate } = parsed.data;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true, deletedAt: null },
  });
  if (!plan) {
    return NextResponse.json(
      { error: "This plan isn't available right now. Please pick another plan." },
      { status: 503 }
    );
  }

  // Plans are gated by dog count — re-check server-side since the client's
  // plan list could be stale (e.g. an admin deactivated/changed it mid-flow).
  if (plan.dogQuantity !== dogIds.length) {
    return NextResponse.json(
      {
        error: `"${plan.name}" is for ${plan.dogQuantity} ${plan.dogQuantity === 1 ? "dog" : "dogs"}, but you selected ${dogIds.length}. Please pick a matching plan.`,
      },
      { status: 400 }
    );
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.userId, deletedAt: null },
  });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  if (!address.serviceAreaId) {
    return NextResponse.json({ error: NOT_SERVING_CITY_MESSAGE }, { status: 422 });
  }
  const walkerAreaIds = await getServiceAreaIdsWithActiveWalker();
  if (!walkerAreaIds.has(address.serviceAreaId)) {
    return NextResponse.json({ error: NO_WALKER_AVAILABLE_MESSAGE }, { status: 422 });
  }

  const dogs = await prisma.dog.findMany({
    where: { id: { in: dogIds }, userId: session.userId, deletedAt: null },
  });
  if (dogs.length !== dogIds.length) {
    return NextResponse.json({ error: "One or more dogs not found" }, { status: 404 });
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliestStart = new Date(today);
  earliestStart.setDate(earliestStart.getDate() + 1);
  if (start < earliestStart) {
    return NextResponse.json({ error: "Start date must be at least tomorrow" }, { status: 400 });
  }

  const end = getPlanEndDate(start, plan.type);

  // Cancelled days from any of the customer's past bookings that haven't
  // been applied yet get tacked onto this booking's duration — same price,
  // extra days. Claimed for real (marked carriedForward) once payment
  // succeeds, in the verify route, so an abandoned checkout doesn't burn
  // the credit.
  const carryDays = await prisma.walkInstance.count({
    where: {
      status: "CANCELLED",
      carriedForward: false,
      booking: { customerId: session.userId, deletedAt: null },
    },
  });
  if (carryDays > 0) {
    end.setDate(end.getDate() + carryDays);
  }

  // A dog can't be on two overlapping active plans at once — catch this
  // before creating any order, not after payment.
  const conflicting = await prisma.booking.findFirst({
    where: {
      customerId: session.userId,
      deletedAt: null,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      startDate: { lte: end },
      endDate: { gte: start },
      bookingDogs: { some: { dogId: { in: dogIds } } },
    },
    include: { bookingDogs: { include: { dog: true } } },
  });

  if (conflicting) {
    const conflictingDogNames = conflicting.bookingDogs
      .filter((bd) => dogIds.includes(bd.dogId))
      .map((bd) => bd.dog.name)
      .join(", ");
    return NextResponse.json(
      {
        error: `${conflictingDogNames} already ${dogIds.length > 1 ? "have" : "has"} an active booking from ${formatDate(conflicting.startDate)} to ${formatDate(conflicting.endDate)}. You can book a new plan once it ends.`,
      },
      { status: 409 }
    );
  }

  // Create the Razorpay order BEFORE writing the booking, so a payment
  // provider failure never leaves an orphaned PENDING_PAYMENT booking
  // behind — there's nothing to clean up if this step fails.
  let order;
  try {
    const razorpay = getRazorpayClient();
    order = await razorpay.orders.create({
      amount: plan.price, // paise
      currency: "INR",
      receipt: `strollo_${Date.now()}`,
      notes: { customerId: session.userId },
    });
  } catch (err) {
    console.error("[strollo] Razorpay order creation failed:", err);
    // Razorpay's SDK throws structured errors shaped like
    // { statusCode, error: { code, description } } for API-level
    // rejections (bad key, invalid amount, account not activated, etc).
    // Surface that description directly instead of guessing — it's not
    // sensitive, it's the same message Razorpay's own dashboard would show.
    const razorpayError = err as { error?: { description?: string; code?: string }; message?: string };
    const detail = razorpayError?.error?.description || razorpayError?.message || "Unknown error";
    return NextResponse.json(
      {
        error: `We couldn't reach the payment provider: ${detail}. Check your Razorpay credentials and account status in .env / the Razorpay dashboard.`,
      },
      { status: 502 }
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        customerId: session.userId,
        planId: plan.id,
        addressId: address.id,
        slot,
        startDate: start,
        endDate: end,
        status: "PENDING_PAYMENT",
        priceAtBooking: plan.price,
        carriedOverDays: carryDays,
        bookingDogs: {
          create: dogIds.map((dogId) => ({ dogId })),
        },
      },
    });

    await tx.payment.create({
      data: {
        bookingId: created.id,
        razorpayOrderId: order!.id,
        amount: plan.price,
        status: "CREATED",
      },
    });

    return created;
  });

  return NextResponse.json({
    bookingId: booking.id,
    razorpayOrderId: order.id,
    amount: plan.price,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
