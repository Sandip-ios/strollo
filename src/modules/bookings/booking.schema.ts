import { z } from "zod";

export const createBookingSchema = z.object({
  planId: z.string().min(1, "Select a plan"),
  addressId: z.string().min(1, "Select an address"),
  dogIds: z.array(z.string()).min(1, "Select at least one dog"),
  slot: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"], {
    errorMap: () => ({ message: "Select a walking slot" }),
  }),
  startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Select a valid start date",
  }),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const rateWalkerSchema = z.object({
  score: z.number().int().min(1, "Pick a rating").max(5, "Pick a rating"),
  comment: z.string().max(500).optional().or(z.literal("")),
});
