-- CreateTable "cities"
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- Backfill: one City row per distinct existing service_areas.city value
INSERT INTO "cities" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, sa."city", true, now(), now()
FROM (SELECT DISTINCT "city" FROM "service_areas") sa;

-- AlterTable "service_areas": add cityId (nullable first, backfilled, then required)
ALTER TABLE "service_areas" ADD COLUMN "cityId" TEXT;

UPDATE "service_areas" sa
SET "cityId" = c."id"
FROM "cities" c
WHERE c."name" = sa."city";

ALTER TABLE "service_areas" ALTER COLUMN "cityId" SET NOT NULL;

ALTER TABLE "service_areas" DROP COLUMN "city";
ALTER TABLE "service_areas" DROP COLUMN "pincodes";

CREATE INDEX "service_areas_cityId_idx" ON "service_areas"("cityId");

ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable "walkers": drop the old free-text area field
ALTER TABLE "walkers" DROP COLUMN "area";

-- CreateTable: implicit many-to-many join table for Walker <-> ServiceArea
CREATE TABLE "_ServiceAreaToWalker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ServiceAreaToWalker_AB_unique" ON "_ServiceAreaToWalker"("A", "B");
CREATE INDEX "_ServiceAreaToWalker_B_index" ON "_ServiceAreaToWalker"("B");

ALTER TABLE "_ServiceAreaToWalker" ADD CONSTRAINT "_ServiceAreaToWalker_A_fkey"
    FOREIGN KEY ("A") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ServiceAreaToWalker" ADD CONSTRAINT "_ServiceAreaToWalker_B_fkey"
    FOREIGN KEY ("B") REFERENCES "walkers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
