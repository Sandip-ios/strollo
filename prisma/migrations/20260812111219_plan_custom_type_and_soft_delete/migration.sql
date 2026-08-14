-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- Data cleanup: the Trial Walk plan type is being retired from the admin UI.
-- No bookings ever referenced TRIAL plans (only MONTHLY is wired into booking),
-- so it's safe to remove existing rows outright rather than soft-delete them.
DELETE FROM "plans" WHERE "type" = 'TRIAL';
