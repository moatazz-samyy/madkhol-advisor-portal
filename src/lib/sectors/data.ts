/**
 * Server-side accessors for the sector heatmap. Pulls from the universal-search
 * dataset filtered through sector-classification.json so the classification
 * source is portable (swap for a live MSCI feed later without touching the
 * price/fundamental data layer).
 */

import { ASSETS } from "@/lib/universal-search/data";
import type { Asset } from "@/lib/universal-search/types";
import classification from "./sector-classification.json";
import type { SectorDetail, SectorKey, SectorSummary } from "./types";

const SECTORS = classification.sectors as SectorKey[];
const LABELS = classification.labels as Record<SectorKey, { en: string; ar: string }>;
const SECTOR_OF = classification.map as Record<string, SectorKey>;

function assetsInSector(sector: SectorKey): Asset[] {
  return ASSETS.filter((a) => SECTOR_OF[a.symbol] === sector);
}

function aggregate(stocks: Asset[]): {
  todayChangePct: number;
  ytdReturnPct: number;
  totalMarketCapUsd: number;
} {
  if (stocks.length === 0) {
    return { todayChangePct: 0, ytdReturnPct: 0, totalMarketCapUsd: 0 };
  }
  const totalCap = stocks.reduce((s, a) => s + a.marketCapUsd, 0);
  // Equal-weight fallback if total cap is zero (shouldn't happen)
  if (totalCap === 0) {
    const n = stocks.length;
    return {
      todayChangePct: stocks.reduce((s, a) => s + a.priceChangePct, 0) / n,
      ytdReturnPct: stocks.reduce((s, a) => s + a.ytdReturn, 0) / n,
      totalMarketCapUsd: 0,
    };
  }
  return {
    todayChangePct:
      stocks.reduce((s, a) => s + a.priceChangePct * a.marketCapUsd, 0) / totalCap,
    ytdReturnPct:
      stocks.reduce((s, a) => s + a.ytdReturn * a.marketCapUsd, 0) / totalCap,
    totalMarketCapUsd: totalCap,
  };
}

export function getSectorSummaries(): SectorSummary[] {
  return SECTORS.map((key) => {
    const stocks = assetsInSector(key);
    const agg = aggregate(stocks);
    return {
      key,
      labelEn: LABELS[key].en,
      labelAr: LABELS[key].ar,
      todayChangePct: +agg.todayChangePct.toFixed(2),
      ytdReturnPct: +agg.ytdReturnPct.toFixed(2),
      stockCount: stocks.length,
      compliantCount: stocks.filter((s) => s.shariahCompliant).length,
      totalMarketCapUsd: +agg.totalMarketCapUsd.toFixed(0),
    };
  });
}

export function getSectorDetail(key: SectorKey): SectorDetail | null {
  if (!SECTORS.includes(key)) return null;
  const stocks = assetsInSector(key).sort(
    (a, b) => b.marketCapUsd - a.marketCapUsd,
  );
  const agg = aggregate(stocks);
  const summary: SectorSummary = {
    key,
    labelEn: LABELS[key].en,
    labelAr: LABELS[key].ar,
    todayChangePct: +agg.todayChangePct.toFixed(2),
    ytdReturnPct: +agg.ytdReturnPct.toFixed(2),
    stockCount: stocks.length,
    compliantCount: stocks.filter((s) => s.shariahCompliant).length,
    totalMarketCapUsd: +agg.totalMarketCapUsd.toFixed(0),
  };
  return { key, labelEn: LABELS[key].en, labelAr: LABELS[key].ar, summary, stocks };
}

export function isValidSectorKey(s: string): s is SectorKey {
  return (SECTORS as string[]).includes(s);
}

export { SECTORS, LABELS };
