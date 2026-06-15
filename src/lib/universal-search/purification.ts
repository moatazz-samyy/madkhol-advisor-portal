/**
 * Stock Purification (Tazkiyat al-As-hum)
 *
 * Even Shariah-compliant companies sometimes earn incidental impure income —
 * usually interest on cash deposits, or a tiny slice of haram revenue under the
 * 5% screen. Holders of those shares are expected to donate that portion of
 * their gains to charity. Real Shariah ETFs (SPUS, HLAL, WSHR) publish annual
 * per-share purification figures; individual stocks are computed by Shariah
 * boards each year.
 *
 * Demo numbers here are deterministic and sector-calibrated — they're meant to
 * look realistic in a CEO walkthrough, not to be used in production.
 */

import type { Asset, GicsSector } from "./types";

// Annual rate of incidental impure income as a % of share price, by sector.
// Calibrated to match the order of magnitude that real Shariah boards report
// (typically 0.02%–0.30% of price for compliant equities).
const RATE_BY_SECTOR: Record<GicsSector, number> = {
  tech: 0.0018,
  healthcare: 0.0012,
  consumer_discretionary: 0.0010,
  consumer_staples: 0.0005,
  communication: 0.0015,
  industrials: 0.0010,
  energy: 0.0008,
  materials: 0.0008,
  utilities: 0.0006,
  real_estate: 0.0004,
  diversified: 0.0009, // Shariah ETFs — covers their basket
  financials: 0,       // never compliant; UI will show "—"
};

export type Purification = {
  perShareUsd: number;
  ratePct: number;       // annual rate as % (for tooltip transparency)
  applicable: boolean;   // false → non-compliant asset, no purification path
};

export function computePurification(asset: Asset): Purification {
  if (!asset.shariahCompliant) {
    return { perShareUsd: 0, ratePct: 0, applicable: false };
  }
  const rate = RATE_BY_SECTOR[asset.sector] ?? 0;
  const perShare = asset.lastPrice * rate;
  return {
    perShareUsd: perShare,
    ratePct: rate * 100,
    applicable: true,
  };
}

/**
 * Format the per-share USD amount. We show 4 decimal places for stocks under
 * $100 and 3 for larger prices so the value never reads as $0.00.
 */
export function fmtPurification(perShareUsd: number, price: number): string {
  const decimals = price < 100 ? 4 : 3;
  return `$${perShareUsd.toFixed(decimals)}`;
}
