/**
 * Watchlist data accessor — fetch all watchlists + their items for an advisor.
 * Used at server-component boundary; client gets a serialized array.
 */

import { prisma } from "@/lib/prisma";

export type WatchlistSummary = {
  id: string;
  name: string;
  nameAr: string | null;
  itemCount: number;
  symbols: string[];   // de-duped, used to power star-state + membership filter
};

export async function getWatchlistsForAdvisor(
  advisorId: string,
): Promise<WatchlistSummary[]> {
  const rows = await prisma.watchlist.findMany({
    where: { advisorId },
    include: { items: { select: { symbol: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    nameAr: w.nameAr,
    itemCount: w.items.length,
    symbols: w.items.map((i) => i.symbol),
  }));
}
