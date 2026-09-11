import { prisma } from "@/lib/prisma";
import { masterListItemRoutes } from "@/lib/master-list";

export const { PATCH, DELETE } = masterListItemRoutes(prisma.city, "City", "CITY");
