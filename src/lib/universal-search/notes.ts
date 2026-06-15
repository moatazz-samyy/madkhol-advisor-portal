/**
 * Asset notes accessor — fetch all advisor notes as a symbol-keyed lookup.
 */

import { prisma } from "@/lib/prisma";

export type AssetNoteSummary = {
  symbol: string;
  body: string;
  updatedAt: string; // ISO string for serialization across the client boundary
};

export async function getAssetNotesForAdvisor(
  advisorId: string,
): Promise<Record<string, AssetNoteSummary>> {
  const rows = await prisma.assetNote.findMany({
    where: { advisorId },
    select: { symbol: true, body: true, updatedAt: true },
  });
  const out: Record<string, AssetNoteSummary> = {};
  for (const r of rows) {
    out[r.symbol] = {
      symbol: r.symbol,
      body: r.body,
      updatedAt: r.updatedAt.toISOString(),
    };
  }
  return out;
}
