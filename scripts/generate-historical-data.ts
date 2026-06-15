/**
 * One-shot generator for src/lib/optimizer/historical-data.json
 *
 * Produces 36 months of monthly returns for each asset in the universal-search
 * dataset, using a deterministic seeded factor model with three sources:
 *   r_i_t = β_i · market_t + sectorLoad · sector_s_t + ε_i_t
 *
 * The asset-class targets (annualized mean and vol) are realistic ranges, not
 * specific real-world numbers — values are produced so the optimizer's outputs
 * are sensible without claiming to match any actual historical period.
 *
 * Run via: npx tsx scripts/generate-historical-data.ts
 */

import fs from "node:fs";
import path from "node:path";
import { ASSETS } from "../src/lib/universal-search/data";
import type { GicsSector } from "../src/lib/universal-search/types";

// ---- Seeded RNG (mulberry32) ----
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Box-Muller from uniform RNG
function gaussianSampler(rng: () => number) {
  return () => {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

const rng = mulberry32(20260609);
const gauss = gaussianSampler(rng);

// ---- Annualized targets per asset class ----
// Lookup by (sector + symbol overrides) → { meanA, volA, beta }
type AssetTarget = { meanA: number; volA: number; beta: number };

const SECTOR_DEFAULTS: Record<GicsSector, AssetTarget> = {
  tech:                    { meanA: 0.18, volA: 0.30, beta: 1.30 },
  healthcare:              { meanA: 0.10, volA: 0.18, beta: 0.75 },
  financials:              { meanA: 0.12, volA: 0.22, beta: 1.10 },
  consumer_discretionary:  { meanA: 0.12, volA: 0.26, beta: 1.15 },
  consumer_staples:        { meanA: 0.08, volA: 0.15, beta: 0.60 },
  communication:           { meanA: 0.12, volA: 0.22, beta: 1.00 },
  industrials:             { meanA: 0.10, volA: 0.20, beta: 1.00 },
  energy:                  { meanA: 0.08, volA: 0.28, beta: 0.90 },
  materials:               { meanA: 0.08, volA: 0.20, beta: 0.95 },
  utilities:               { meanA: 0.06, volA: 0.14, beta: 0.50 },
  real_estate:             { meanA: 0.06, volA: 0.18, beta: 0.70 },
  diversified:             { meanA: 0.12, volA: 0.16, beta: 1.00 }, // broad ETFs
};

// Symbol-specific overrides reflecting recent regime + idiosyncrasies
const SYMBOL_OVERRIDES: Record<string, Partial<AssetTarget>> = {
  AAPL: { meanA: 0.20, volA: 0.27, beta: 1.10 },
  MSFT: { meanA: 0.18, volA: 0.24, beta: 1.05 },
  GOOGL:{ meanA: 0.18, volA: 0.27, beta: 1.10 },
  NVDA: { meanA: 0.45, volA: 0.50, beta: 1.55 }, // outlier upside
  AVGO: { meanA: 0.32, volA: 0.38, beta: 1.30 },
  ADBE: { meanA: 0.12, volA: 0.30, beta: 1.20 },
  ORCL: { meanA: 0.22, volA: 0.27, beta: 1.05 },
  LLY:  { meanA: 0.30, volA: 0.28, beta: 0.85 },
  ABBV: { meanA: 0.14, volA: 0.18, beta: 0.70 },
  PFE:  { meanA: 0.04, volA: 0.22, beta: 0.65 },
  COST: { meanA: 0.22, volA: 0.20, beta: 0.85 },
  NKE:  { meanA: -0.06, volA: 0.26, beta: 1.20 },
  TSLA: { meanA: 0.00, volA: 0.55, beta: 1.80 },
  AMZN: { meanA: 0.18, volA: 0.30, beta: 1.25 },
  NFLX: { meanA: 0.30, volA: 0.35, beta: 1.30 },
  // Shariah ETFs
  SPUS: { meanA: 0.16, volA: 0.20, beta: 1.05 },
  HLAL: { meanA: 0.15, volA: 0.20, beta: 1.00 },
  SPSK: { meanA: 0.04, volA: 0.06, beta: 0.05 }, // sukuk
  // Conventional bond ETF
  AGG:  { meanA: 0.03, volA: 0.07, beta: 0.05 },
  // Broad index ETFs
  SPY:  { meanA: 0.14, volA: 0.16, beta: 1.00 },
  VOO:  { meanA: 0.14, volA: 0.16, beta: 1.00 },
  QQQ:  { meanA: 0.20, volA: 0.22, beta: 1.20 },
};

const N_MONTHS = 36;

// Market factor: monthly mean ~0.7% (~8.5% annual), monthly vol ~4% (~14% annual)
const MARKET_MEAN_MO = 0.007;
const MARKET_VOL_MO = 0.04;
const SECTOR_VOL_MO = 0.015;
const SECTOR_LOAD = 0.6;

// Pre-roll market and sector factor draws — these are SHARED across assets
const marketReturns: number[] = Array.from({ length: N_MONTHS }, () =>
  MARKET_MEAN_MO + MARKET_VOL_MO * gauss(),
);
const allSectors = Array.from(new Set(ASSETS.map((a) => a.sector)));
const sectorFactors: Record<string, number[]> = {};
for (const s of allSectors) {
  sectorFactors[s] = Array.from({ length: N_MONTHS }, () => SECTOR_VOL_MO * gauss());
}

type AssetReturnSeries = {
  symbol: string;
  sector: GicsSector;
  shariahCompliant: boolean;
  // 36 monthly returns (decimal, e.g. 0.02 = 2%)
  monthly: number[];
  // Realized stats (computed from monthly)
  meanA: number;
  volA: number;
  // Target params (so we can recompute on the fly if needed)
  target: AssetTarget;
};

const series: AssetReturnSeries[] = [];

for (const asset of ASSETS) {
  const base = SECTOR_DEFAULTS[asset.sector];
  const ov = SYMBOL_OVERRIDES[asset.symbol] ?? {};
  const target: AssetTarget = {
    meanA: ov.meanA ?? base.meanA,
    volA: ov.volA ?? base.volA,
    beta: ov.beta ?? base.beta,
  };
  const meanMo = target.meanA / 12;
  const volMo = target.volA / Math.sqrt(12);

  // Idiosyncratic vol — what remains after factor exposures
  const factorVar =
    Math.pow(target.beta * MARKET_VOL_MO, 2) +
    Math.pow(SECTOR_LOAD * SECTOR_VOL_MO, 2);
  const idiosyncraticVar = Math.max(0, volMo * volMo - factorVar);
  const idiosyncraticVol = Math.sqrt(idiosyncraticVar);

  // Drift correction so factor model recovers the target mean
  const factorMeanContribution = target.beta * MARKET_MEAN_MO;
  const idiosyncraticMean = meanMo - factorMeanContribution;

  const monthly: number[] = [];
  for (let t = 0; t < N_MONTHS; t++) {
    const m = marketReturns[t];
    const s = sectorFactors[asset.sector][t];
    const eps = idiosyncraticMean + idiosyncraticVol * gauss();
    monthly.push(+(target.beta * m + SECTOR_LOAD * s + eps).toFixed(6));
  }

  // Realized stats — sanity check that we're in the right ballpark
  const realizedMean = monthly.reduce((a, b) => a + b, 0) / monthly.length;
  const realizedVar = monthly.reduce((a, r) => a + (r - realizedMean) ** 2, 0) / (monthly.length - 1);
  const realizedVol = Math.sqrt(realizedVar);
  series.push({
    symbol: asset.symbol,
    sector: asset.sector,
    shariahCompliant: asset.shariahCompliant,
    monthly,
    meanA: +(realizedMean * 12).toFixed(4),
    volA: +(realizedVol * Math.sqrt(12)).toFixed(4),
    target,
  });
}

const output = {
  version: "2026-06-09",
  description:
    "36 months of monthly returns per asset, generated from a seeded three-factor model (market + sector + idiosyncratic). Annualized means and vols are realistic per asset class but do not correspond to any specific historical window. The optimizer reads `monthly` directly; `meanA` and `volA` are realized stats included for sanity checking.",
  nMonths: N_MONTHS,
  marketFactorMo: marketReturns,
  series,
};

const outPath = path.resolve(
  process.cwd(),
  "src/lib/optimizer/historical-data.json",
);
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`wrote ${series.length} series × ${N_MONTHS} months → ${outPath}`);

// Quick sanity printout
const summary = series
  .slice(0, 6)
  .map((s) => ({ symbol: s.symbol, meanA: s.meanA, volA: s.volA }));
console.table(summary);
