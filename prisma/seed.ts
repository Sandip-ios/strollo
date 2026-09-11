import { PrismaClient } from "@prisma/client";
import { DOG_BREEDS, TEMPERAMENT_OPTIONS } from "../src/lib/dog-constants";

const prisma = new PrismaClient();

const VACCINATION_TYPES = [
  "Rabies",
  "DHPPi (Core)",
  "Bordetella (Kennel Cough)",
  "Deworming",
  "Anti-Rabies Booster",
];

async function main() {
  const adminMobile = process.env.SEED_ADMIN_MOBILE || "+919999999999";

  const admin = await prisma.user.upsert({
    where: { mobileNumber: adminMobile },
    update: { role: "ADMIN" },
    create: {
      mobileNumber: adminMobile,
      name: "Strollo Admin",
      role: "ADMIN",
    },
  });

  console.log(`Admin ready: ${admin.mobileNumber} (login with OTP 123456)`);

  const existingPlan = await prisma.plan.findFirst({ where: { type: "MONTHLY" } });
  if (!existingPlan) {
    await prisma.plan.create({
      data: {
        type: "MONTHLY",
        name: "Monthly Plan",
        price: 159900, // ₹1599
        isActive: true,
      },
    });
    console.log("Monthly plan seeded at ₹1599");
  }

  for (const name of DOG_BREEDS) {
    await prisma.breed.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of TEMPERAMENT_OPTIONS) {
    await prisma.temperament.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of VACCINATION_TYPES) {
    await prisma.vaccinationType.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("Master data seeded: breeds, temperaments, vaccination types");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
