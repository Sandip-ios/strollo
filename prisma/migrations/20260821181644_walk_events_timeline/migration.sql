-- CreateEnum
CREATE TYPE "WalkEventType" AS ENUM ('PEE', 'POO', 'DRANK_WATER', 'HAPPY', 'RESTED', 'OTHER');

-- CreateEnum
CREATE TYPE "WalkMood" AS ENUM ('NOT_GOOD', 'OKAY', 'GOOD', 'EXCELLENT');

-- AlterTable
ALTER TABLE "walk_instances" ADD COLUMN "mood" "WalkMood";

-- CreateTable
CREATE TABLE "walk_events" (
    "id" TEXT NOT NULL,
    "walkInstanceId" TEXT NOT NULL,
    "type" "WalkEventType" NOT NULL,
    "note" TEXT,
    "photoUrl" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "walk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "walk_events_walkInstanceId_idx" ON "walk_events"("walkInstanceId");

ALTER TABLE "walk_events" ADD CONSTRAINT "walk_events_walkInstanceId_fkey"
    FOREIGN KEY ("walkInstanceId") REFERENCES "walk_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
