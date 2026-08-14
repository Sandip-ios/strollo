/*
  Warnings:

  - Added the required column `houseNumber` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `area` to the `walkers` table without a default value. This is not possible if the table is not empty.

*/

ALTER TABLE "addresses" ADD COLUMN "houseNumber" TEXT;
UPDATE "addresses" SET "houseNumber" = 'TBD' WHERE "houseNumber" IS NULL;
ALTER TABLE "addresses" ALTER COLUMN "houseNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "walkers" ADD COLUMN     "area" TEXT,
ADD COLUMN     "govIdNumber" TEXT,
ADD COLUMN     "govIdPhotoUrl" TEXT,
ADD COLUMN     "govIdType" TEXT,
ADD COLUMN     "notes" TEXT;

UPDATE "walkers" SET "area" = 'TBD' WHERE "area" IS NULL;

ALTER TABLE "walkers" ALTER COLUMN "area" SET NOT NULL;
