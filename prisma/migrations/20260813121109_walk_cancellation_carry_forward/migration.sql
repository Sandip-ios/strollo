-- AlterEnum
ALTER TYPE "WalkStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "carriedOverDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "walk_instances" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "carriedForward" BOOLEAN NOT NULL DEFAULT false;
