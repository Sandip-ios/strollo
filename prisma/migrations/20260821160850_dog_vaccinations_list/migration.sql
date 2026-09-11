-- Replace the two fixed vaccination booleans with an open-ended list
-- driven by the admin-managed VaccinationType master data.
ALTER TABLE "dogs" DROP COLUMN "isVaccinated";
ALTER TABLE "dogs" DROP COLUMN "isRabiesVaccinated";
ALTER TABLE "dogs" ADD COLUMN "vaccinations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
