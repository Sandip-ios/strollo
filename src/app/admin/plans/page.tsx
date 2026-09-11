import { redirect } from "next/navigation";
import type { Plan } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import PlanCard from "@/components/admin/PlanCard";
import CreatePlanCard from "@/components/admin/CreatePlanCard";
import CreateCustomPlanCard from "@/components/admin/CreateCustomPlanCard";

const FIXED_PLAN_TYPES = ["MONTHLY", "WEEKLY"] as const;

export default async function AdminPlansPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  // TRIAL is a deprecated PlanType kept only so old migrations/rows stay
  // valid — it's excluded here since the feature it backed was removed.
  const plans = (await prisma.plan.findMany({
    where: { deletedAt: null, type: { not: "TRIAL" } },
  })) as Array<Omit<Plan, "type"> & { type: "MONTHLY" | "WEEKLY" | "CUSTOM" }>;
  const plansByType = Object.fromEntries(
    plans.filter((p) => p.type !== "CUSTOM").map((p) => [p.type, p])
  );
  const customPlans = plans.filter((p) => p.type === "CUSTOM");

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/master" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Plans &amp; Pricing</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Prices can be changed anytime. Existing bookings keep the price they
          were made at — changes here only affect new bookings.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIXED_PLAN_TYPES.map((type) => {
            const plan = plansByType[type];
            return plan ? (
              <PlanCard key={type} plan={plan} />
            ) : (
              <CreatePlanCard key={type} type={type} />
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink">Custom Plans</h2>
          <p className="mt-1 text-sm text-ink/60">
            Create any number of additional plans beyond Monthly and Weekly.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {customPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
            <CreateCustomPlanCard />
          </div>
        </div>
      </div>
    </main>
  );
}
