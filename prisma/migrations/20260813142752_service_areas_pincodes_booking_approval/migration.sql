-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'APPROVED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_APPROVED';

-- AlterTable
ALTER TABLE "service_areas" ADD COLUMN     "pincodes" TEXT[];
