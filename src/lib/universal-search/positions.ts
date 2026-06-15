/**
 * Position-aware lookups — counts of clients holding each symbol across the
 * advisor's book. Powers the "Held by N clients" column in Search results.
 *
 * Strategy: one query that joins Holdings → Fund.symbol → Client.advisorId,
 * grouped by symbol. O(holdings) per advisor — fine at any realistic book
 * size. Cached per-request via React's automatic dedupe of identical args.
 */

import { prisma } from "@/lib/prisma";

export type SymbolPositionSummary = {
  symbol: string;
  clientCount: number;
  totalValueSar: number;
  // Up to 3 client names for the hover tooltip — keeps payload small.
  topClientPreview: { id: string; name: string; nameAr: string; valueSar: number }[];
};

export async function getSymbolPositionsForAdvisor(
  advisorId: string,
): Promise<Map<string, SymbolPositionSummary>> {
  const rows = await prisma.holding.findMany({
    where: {
      portfolio: {
        client: { advisorId },
      },
      currentValue: { gt: 0 },
    },
    select: {
      currentValue: true,
      fund: { select: { symbol: true } },
      portfolio: {
        select: {
          client: { select: { id: true, name: true, nameAr: true } },
        },
      },
    },
  });

  const bySymbol = new Map<string, SymbolPositionSummary>();
  for (const r of rows) {
    if (!r.fund.symbol) continue;
    const client = r.portfolio.client;
    if (!client) continue;
    const entry =
      bySymbol.get(r.fund.symbol) ??
      ({
        symbol: r.fund.symbol,
        clientCount: 0,
        totalValueSar: 0,
        topClientPreview: [],
      } satisfies SymbolPositionSummary);

    entry.totalValueSar += r.currentValue;

    // De-dupe by client id (a client may hold the same symbol in multiple
    // funds if there's a symbol/fund mapping quirk).
    if (!entry.topClientPreview.find((p) => p.id === client.id)) {
      entry.clientCount += 1;
      entry.topClientPreview.push({
        id: client.id,
        name: client.name,
        nameAr: client.nameAr,
        valueSar: r.currentValue,
      });
    } else {
      const existing = entry.topClientPreview.find((p) => p.id === client.id)!;
      existing.valueSar += r.currentValue;
    }

    bySymbol.set(r.fund.symbol, entry);
  }

  // Trim each entry's preview to top 3 by value
  for (const entry of bySymbol.values()) {
    entry.topClientPreview.sort((a, b) => b.valueSar - a.valueSar);
    entry.topClientPreview = entry.topClientPreview.slice(0, 3);
  }

  return bySymbol;
}
