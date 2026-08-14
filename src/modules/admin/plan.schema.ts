import { z } from "zod";

// Price is entered/displayed in rupees in the UI, stored in paise in the DB.
export const updatePlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  priceRupees: z.number().min(1, "Enter a valid price"),
  dogQuantity: z.number().int().min(1, "Must cover at least 1 dog"),
  isActive: z.boolean(),
});

export const createPlanSchema = updatePlanSchema.extend({
  type: z.enum(["WEEKLY", "MONTHLY", "CUSTOM"]),
});
