import { z } from "zod";

export const addressSchema = z.object({
  houseNumber: z.string().min(1, "Flat / house number is required").max(30),
  label: z.string().min(1, "Society / building name is required").max(80),
  line1: z.string().min(1, "Area / street is required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  latitude: z.number({ invalid_type_error: "Pick a location on the map" }),
  longitude: z.number({ invalid_type_error: "Pick a location on the map" }),
  isDefault: z.boolean().optional(),
  // Which Service Area this address falls in — set by picking City + Area
  // from the available list. Left blank when the customer's area isn't
  // listed yet, which is treated as "not serviceable".
  serviceAreaId: z.string().optional().or(z.literal("")),
});
