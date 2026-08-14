-- CreateTable
CREATE TABLE "walker_ratings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "walker_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "walker_ratings_bookingId_key" ON "walker_ratings"("bookingId");

-- CreateIndex
CREATE INDEX "walker_ratings_walkerId_idx" ON "walker_ratings"("walkerId");

-- AddForeignKey
ALTER TABLE "walker_ratings" ADD CONSTRAINT "walker_ratings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "walker_ratings" ADD CONSTRAINT "walker_ratings_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "walkers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "walker_ratings" ADD CONSTRAINT "walker_ratings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
