import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import AdminHeader from "@/components/layout/AdminHeader";

export default async function AdminRatingsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const [walkers, recentRatings] = await Promise.all([
    prisma.walker.findMany({
      where: { deletedAt: null },
      include: { ratings: true },
      orderBy: { name: "asc" },
    }),
    prisma.walkerRating.findMany({
      include: { walker: true, customer: true, booking: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const walkerSummaries = walkers
    .map((w) => {
      const count = w.ratings.length;
      const avg = count > 0 ? w.ratings.reduce((s, r) => s + r.score, 0) / count : null;
      return { id: w.id, name: w.name, count, avg };
    })
    .sort((a, b) => {
      // Rated walkers first, worst average first — surfaces a walker
      // trending badly at a glance. Unrated walkers sort to the bottom.
      if (a.avg === null && b.avg === null) return a.name.localeCompare(b.name);
      if (a.avg === null) return 1;
      if (b.avg === null) return -1;
      return a.avg - b.avg;
    });

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/ratings" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Walker Ratings</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Customers rate once per subscription, after it ends — not per walk. Sorted worst
          average first so a walker trending badly stands out.
        </p>

        <div className="overflow-x-auto rounded-xl border border-sand bg-white">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-sand bg-sand/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">Walker</th>
                <th className="px-4 py-2.5 font-medium">Average</th>
                <th className="px-4 py-2.5 font-medium">Ratings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {walkerSummaries.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-medium text-ink">{w.name}</td>
                  <td className="px-4 py-3">
                    {w.avg !== null ? (
                      <span className="flex items-center gap-1 text-ink">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                        {w.avg.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-ink/40">No ratings yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{w.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-10 font-display text-lg font-semibold text-ink">Recent ratings</h2>
        {recentRatings.length === 0 ? (
          <p className="rounded-xl border border-sand bg-white p-5 text-sm text-ink/50">
            No ratings submitted yet.
          </p>
        ) : (
          <ul className="divide-y divide-sand overflow-hidden rounded-xl border border-sand bg-white">
            {recentRatings.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">
                    {r.walker.name}{" "}
                    <span className="font-normal text-ink/40">rated by {r.customer.name ?? r.customer.mobileNumber}</span>
                  </p>
                  <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                    {r.score}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink/40">
                  {r.booking.plan.name} · {formatDate(r.createdAt)}
                </p>
                {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
