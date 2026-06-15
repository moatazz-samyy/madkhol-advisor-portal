/**
 * Pure search/filter logic over the universal asset universe.
 * Client-side filtering against the static dataset is fast enough that we don't
 * need any server roundtrip for the UI to feel instant.
 */

import { ASSETS } from "./data";
import { bucketFor, type Asset, type NumericRange, type SearchFilters } from "./types";

// Filter passes only if the asset's value is set AND inside [min, max]. Assets
// with no value for a field (no historical series, no P/E reported) are excluded
// from the result set whenever the advisor opts in to filtering by that field.
function inRange(value: number | undefined, range: NumericRange): boolean {
  if (value === undefined) return false;
  return value >= range[0] && value <= range[1];
}

export function searchAssets(
  filters: SearchFilters,
  watchlistSymbolUnion?: Set<string>,
): Asset[] {
  const needle = filters.q.trim().toLowerCase();

  return ASSETS.filter((a) => {
    // Watchlist membership — caller passes the union of selected lists' symbols
    if (filters.watchlistIds.length > 0 && watchlistSymbolUnion) {
      if (!watchlistSymbolUnion.has(a.symbol)) return false;
    }
    // Free-text — symbol prefix wins, then name contains
    if (needle) {
      const matchSymbol = a.symbol.toLowerCase().startsWith(needle);
      const matchName =
        a.nameEn.toLowerCase().includes(needle) ||
        a.nameAr.includes(filters.q.trim());
      if (!matchSymbol && !matchName) return false;
    }

    if (filters.assetClasses.length && !filters.assetClasses.includes(a.assetClass)) {
      return false;
    }
    if (filters.sectors.length && !filters.sectors.includes(a.sector)) {
      return false;
    }
    if (filters.regions.length && !filters.regions.includes(a.region)) {
      return false;
    }
    if (filters.marketCapBuckets.length) {
      if (!filters.marketCapBuckets.includes(bucketFor(a.marketCapUsd))) return false;
    }
    if (filters.shariahOnly && !a.shariahCompliant) return false;
    if (a.ytdReturn < filters.ytdRange[0] || a.ytdReturn > filters.ytdRange[1]) {
      return false;
    }

    // Customize-panel range filters — applied only when set.
    const r = filters.ranges;
    if (r.return1Y && !inRange(a.return1Y, r.return1Y)) return false;
    if (r.return3Y && !inRange(a.return3Y, r.return3Y)) return false;
    if (r.volatility1Y && !inRange(a.volatility1Y, r.volatility1Y)) return false;
    if (r.peRatio && !inRange(a.peRatio, r.peRatio)) return false;
    if (r.dividendYield && !inRange(a.dividendYield, r.dividendYield)) return false;
    if (r.marketCap && !inRange(a.marketCapUsd, r.marketCap)) return false;
    return true;
  }).sort((x, y) => {
    // Symbol-prefix matches first when there's a query
    if (needle) {
      const xPrefix = x.symbol.toLowerCase().startsWith(needle);
      const yPrefix = y.symbol.toLowerCase().startsWith(needle);
      if (xPrefix !== yPrefix) return xPrefix ? -1 : 1;
    }
    return y.marketCapUsd - x.marketCapUsd;
  });
}

/**
 * Synthesize a 90-day daily price series from the asset's YTD return.
 * Pure function — same input = same output, so SSR and CSR agree.
 */
export function synthesizePriceHistory(asset: Asset, days = 90) {
  const start = asset.lastPrice / (1 + asset.ytdReturn / 100);
  // Seeded jitter from the symbol so different assets look different
  let seed = 0;
  for (let i = 0; i < asset.symbol.length; i++) seed = (seed * 31 + asset.symbol.charCodeAt(i)) | 0;
  const rng = mulberry32(Math.abs(seed));

  const out: { day: number; price: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const jitter = (rng() - 0.5) * 0.04;
    const noise = Math.sin(i * 0.13 + seed * 0.001) * 0.012;
    const price = start + (asset.lastPrice - start) * t * (1 + jitter + noise);
    out.push({ day: i, price: +price.toFixed(2) });
  }
  return out;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
