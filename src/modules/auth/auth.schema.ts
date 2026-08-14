import { z } from "zod";

// Indian mobile numbers: 10 digits, optionally prefixed with +91.
export const mobileNumberSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), {
    message: "Enter a valid 10-digit Indian mobile number",
  })
  .transform((v) => (v.startsWith("+91") ? v : `+91${v}`));

export const requestOtpSchema = z.object({
  mobileNumber: mobileNumberSchema,
  purpose: z.enum(["SIGNUP", "LOGIN"]),
});

export const verifyOtpSchema = z
  .object({
    mobileNumber: mobileNumberSchema,
    code: z.string().length(6),
    purpose: z.enum(["SIGNUP", "LOGIN"]),
    name: z.string().min(1).optional(), // used on SIGNUP only
    acceptedTerms: z.boolean().optional(), // used on SIGNUP only
  })
  .refine((data) => data.purpose !== "SIGNUP" || data.acceptedTerms === true, {
    message: "You must accept the Terms of Service and Privacy Policy to sign up",
    path: ["acceptedTerms"],
  });
