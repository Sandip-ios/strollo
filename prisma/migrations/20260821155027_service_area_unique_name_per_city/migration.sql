-- Prevent the same area name from being added twice under the same city
CREATE UNIQUE INDEX "service_areas_name_cityId_key" ON "service_areas"("name", "cityId");
