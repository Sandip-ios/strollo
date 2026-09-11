import { z } from "zod";

export const GOV_ID_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Driving License",
  "Voter ID",
] as const;

export const walkerSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  mobileNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), {
      message: "Enter a valid 10-digit Indian mobile number",
    })
    .transform((v) => (v.startsWith("+91") ? v : `+91${v}`)),
  photoUrl: z.string().url().optional().or(z.literal("")),
  serviceAreaIds: z.array(z.string()).default([]),
  govIdType: z.string().max(40).optional().or(z.literal("")),
  govIdNumber: z.string().max(40).optional().or(z.literal("")),
  govIdPhotoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
