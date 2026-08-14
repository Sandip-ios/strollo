import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
