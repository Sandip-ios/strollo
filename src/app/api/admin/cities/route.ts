import { prisma } from "@/lib/prisma";
import { masterListRoutes } from "@/lib/master-list";

export const { GET, POST } = masterListRoutes(prisma.city, "City", "CITY");
