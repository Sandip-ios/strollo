// Refund is pro-rated by walk-day: each scheduled day is worth an equal
// fraction of the total plan price. Only walks still in SCHEDULED status
// count as "remaining" — that status already excludes COMPLETED, ON_GOING,
// MISSED, and already-CANCELLED walks, so it's the correct refundable set
// with no extra filtering needed.
export function computeRefundAmount(params: {
  priceAtBookingPaise: number;
  totalWalks: number;
  remainingScheduledWalks: number;
}): number {
  const { priceAtBookingPaise, totalWalks, remainingScheduledWalks } = params;
  if (totalWalks === 0) return 0;
  return Math.round((priceAtBookingPaise * remainingScheduledWalks) / totalWalks);
}
