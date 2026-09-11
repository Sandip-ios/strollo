import { z } from "zod";

export const serviceAreaSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  cityId: z.string().min(1, "Select a city"),
  isActive: z.boolean().default(true),
});
