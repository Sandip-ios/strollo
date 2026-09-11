import { prisma } from "@/lib/prisma";
import { masterListRoutes } from "@/lib/master-list";

export const { GET, POST } = masterListRoutes(prisma.vaccinationType, "VaccinationType", "VACCINATION_TYPE");
