-- A notification can carry a destination URL, so tapping it can take the
-- user straight to the relevant page (e.g. a booking that needs a walker).
ALTER TABLE "notifications" ADD COLUMN "link" TEXT;
