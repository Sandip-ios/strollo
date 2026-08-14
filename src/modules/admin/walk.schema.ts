import { z } from "zod";

export const updateWalkSchema = z.object({
  status: z.enum(["SCHEDULED", "ON_GOING", "COMPLETED", "MISSED"]),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  distanceMeters: z.number().min(0).optional().nullable(),
  durationSec: z.number().int().min(0).optional().nullable(),
  pooUpdate: z.boolean().optional().nullable(),
  peeUpdate: z.boolean().optional().nullable(),
  walkerNotes: z.string().max(500).optional().or(z.literal("")),
});
