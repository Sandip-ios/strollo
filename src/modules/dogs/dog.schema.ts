import { z } from "zod";

export const dogSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50),
    breed: z.string().min(1, "Breed is required").max(80),
    size: z.enum(["SMALL", "MEDIUM", "LARGE"], {
      errorMap: () => ({ message: "Select a size" }),
    }),
    age: z.number().int().min(0, "Age must be 0 or more").max(30, "That age doesn't look right"),
    weightKg: z
      .number()
      .min(0.5, "Enter a valid weight")
      .max(120, "That weight doesn't look right"),
    gender: z.enum(["MALE", "FEMALE"]),
    isVaccinated: z.boolean().default(false),
    isRabiesVaccinated: z.boolean().default(false),
    temperament: z.array(z.string()).default([]),
    isRegisteredWithAMC: z.boolean().default(false),
    amcRegistrationNumber: z.string().max(50).optional().or(z.literal("")),
    medicalNotes: z.string().max(1000).optional().or(z.literal("")),
    behaviourNotes: z.string().max(1000).optional().or(z.literal("")),
    photoUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.isRegisteredWithAMC || (data.amcRegistrationNumber ?? "").trim().length > 0,
    {
      message: "Enter the AMC registration number",
      path: ["amcRegistrationNumber"],
    }
  );
