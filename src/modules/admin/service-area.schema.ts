import { z } from "zod";

const pincodeList = z
  .string()
  .transform((v) =>
    Array.from(
      new Set(
        v
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      )
    )
  )
  .refine((list) => list.length > 0, "Enter at least one pincode")
  .refine((list) => list.every((p) => /^\d{6}$/.test(p)), {
    message: "Pincodes must be 6 digits each, separated by commas",
  });

export const serviceAreaSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  city: z.string().min(1, "City is required").max(60),
  pincodes: pincodeList,
  isActive: z.boolean().default(true),
});
