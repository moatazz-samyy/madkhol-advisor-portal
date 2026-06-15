/**
 * Top-level optimizer orchestration. Pure function — pulls historical returns
 * from the JSON dataset, runs the selected method, projects onto constraints,
 * and returns a ready-to-render result.
 */

import type { Matrix } from "./math";
import { ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";
import historical from "./historical-data.json";
import {
  annualizedStats,
  blackLittermanCapWeighted,
  equalWeight,
  meanVariance,
  portfolioReturn,
  portfolioVolatility,
  riskParity,
  sharpe,
} from "./methods";
import { projectOntoConstraints } from "./constraints";
import type {
  OptimizationConfig,
  OptimizationResult,
  OptimizerAssetInput,
} from "./types";

const ALLOCATION_BUDGET = 99; // % after 1% cash reserve

type Series = {
  symbol: string;
  sector: string;
  shariahCompliant: boolean;
  monthly: number[];
};
const SERIES_BY_SYMBOL = new Map<string, Series>(
  (historical.series as Series[]).map((s) => [s.symbol, s]),
);

export function runOptimization(
  assets: OptimizerAssetInput[],
  config: OptimizationConfig,
): OptimizationResult {
  const warnings: string[] = [];

  // 1) Enforce Shariah (locked). Drop non-compliant inputs.
  const eligible = assets.filter((a) => {
    if (!a.shariahCompliant) {
      warnings.push(`Dropped ${a.symbol} — not Shariah-compliant.`);
      return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return emptyResult(config, ["No Shariah-compliant assets in the input."]);
  }
  if (eligible.length === 1) {
    return singleAssetResult(eligible[0], config, warnings);
  }

  // 2) Pull return series. Drop assets without historical data with a warning.
  const withSeries: { asset: OptimizerAssetInput; series: number[] }[] = [];
  for (const a of eligible) {
    const s = SERIES_BY_SYMBOL.get(a.symbol);
    if (!s) {
      warnings.push(`Dropped ${a.symbol} — no historical data.`);
      continue;
    }
    withSeries.push({ asset: a, series: s.monthly });
  }
  if (withSeries.length < 2) {
    return emptyResult(config, [
      ...warnings,
      "Need at least 2 assets with historical data to optimize.",
    ]);
  }

  // Build matrices: rows = months, cols = assets
  const nMonths = withSeries[0].series.length;
  const returnsMatrix: Matrix = [];
  for (let t = 0; t < nMonths; t++) {
    returnsMatrix.push(withSeries.map((x) => x.series[t]));
  }
  const { mu, cov } = annualizedStats(returnsMatrix);

  // 3) Run selected method to get raw weights summing to 1.0
  let rawWeights: number[];
  const diagnostics: OptimizationResult["diagnostics"] = {
    nEligible: eligible.length,
    nDroppedShariah: assets.length - eligible.length,
    nDroppedConstraint: 0,
    riskFreeRateAnnual: config.riskFreeRateAnnual,
  };

  switch (config.method) {
    case "equal_weight":
      rawWeights = equalWeight(withSeries.length);
      break;
    case "mean_variance":
      rawWeights = meanVariance(mu, cov, config.riskTolerance, config.riskFreeRateAnnual);
      break;
    case "risk_parity": {
      const rp = riskParity(cov);
      rawWeights = rp.weights;
      diagnostics.iterations = rp.iterations;
      diagnostics.converged = rp.converged;
      break;
    }
    case "black_litterman": {
      const caps = withSeries.map((x) => x.asset.marketCapUsd);
      // Risk tolerance interpolates between cap-weighted (low) and equal (high)
      const shrink = 0.15 + (1 - config.riskTolerance) * 0.5;
      rawWeights = blackLittermanCapWeighted(caps, cov, shrink);
      break;
    }
  }

  // Negative raw weights → clamp to 0 then renormalize (no shorting)
  if (rawWeights.some((w) => w < 0)) {
    const positiveOnly = rawWeights.map((w) => Math.max(0, w));
    const total = positiveOnly.reduce((a, b) => a + b, 0);
    rawWeights = total > 0
      ? positiveOnly.map((w) => w / total)
      : new Array(rawWeights.length).fill(1 / rawWeights.length);
    warnings.push("Short positions clipped to zero (long-only enforced).");
  }

  // 4) Project onto constraints
  const symbols = withSeries.map((x) => x.asset.symbol);
  const sectors = withSeries.map((x) => x.asset.sector);
  const projection = projectOntoConstraints({
    symbols,
    sectors,
    rawWeights,
    targetSumPct: ALLOCATION_BUDGET,
    sectorCaps: config.sectorCaps,
    perAssetBounds: config.perAssetBounds,
  });

  if (!projection.feasible) {
    return {
      method: config.method,
      weights: [],
      cashReserveWeight: config.cashReservePct,
      expectedReturnAnnualPct: 0,
      expectedVolatilityAnnualPct: 0,
      sharpeRatio: 0,
      warnings: [
        projection.message ?? "Constraints are infeasible.",
        ...warnings,
      ],
      diagnostics: { ...diagnostics, nDroppedConstraint: assets.length },
    };
  }

  // 5) Compute portfolio statistics (annualized, %)
  const wDecimal = projection.weightsPct.map((p) => p / 100);
  const portRet = portfolioReturn(wDecimal, mu);
  const portVol = portfolioVolatility(wDecimal, cov);
  const sr = sharpe(portRet, portVol, config.riskFreeRateAnnual);

  // 6) Assemble result rows
  const currentBySymbol = new Map<string, number>();
  for (const a of assets) {
    if (a.currentWeight !== undefined) currentBySymbol.set(a.symbol, a.currentWeight);
  }
  const seedFromUniverse = (sym: string) => ASSETS_BY_SYMBOL.get(sym);
  const weights = withSeries.map((x, i) => ({
    symbol: x.asset.symbol,
    sector: x.asset.sector,
    weight: +projection.weightsPct[i].toFixed(2),
    currentWeight: currentBySymbol.get(x.asset.symbol),
    nameEn: x.asset.nameEn || seedFromUniverse(x.asset.symbol)?.nameEn || x.asset.symbol,
    nameAr: x.asset.nameAr || seedFromUniverse(x.asset.symbol)?.nameAr || x.asset.symbol,
  }));

  return {
    method: config.method,
    weights: weights.map((w) => ({
      symbol: w.symbol,
      weight: w.weight,
      currentWeight: w.currentWeight,
      sector: w.sector,
    })),
    cashReserveWeight: config.cashReservePct,
    expectedReturnAnnualPct: +(portRet * 100).toFixed(2),
    expectedVolatilityAnnualPct: +(portVol * 100).toFixed(2),
    sharpeRatio: +sr.toFixed(2),
    warnings,
    diagnostics: {
      ...diagnostics,
      iterations: diagnostics.iterations ?? projection.iterations,
    },
  };
}

function emptyResult(
  config: OptimizationConfig,
  warnings: string[],
): OptimizationResult {
  return {
    method: config.method,
    weights: [],
    cashReserveWeight: config.cashReservePct,
    expectedReturnAnnualPct: 0,
    expectedVolatilityAnnualPct: 0,
    sharpeRatio: 0,
    warnings,
    diagnostics: {
      nEligible: 0,
      nDroppedShariah: 0,
      nDroppedConstraint: 0,
      riskFreeRateAnnual: config.riskFreeRateAnnual,
    },
  };
}

function singleAssetResult(
  asset: OptimizerAssetInput,
  config: OptimizationConfig,
  warnings: string[],
): OptimizationResult {
  const series = SERIES_BY_SYMBOL.get(asset.symbol);
  const mu = series ? mean(series.monthly) * 12 : 0;
  const vol = series ? stdev(series.monthly) * Math.sqrt(12) : 0;
  return {
    method: config.method,
    weights: [
      {
        symbol: asset.symbol,
        weight: ALLOCATION_BUDGET,
        currentWeight: asset.currentWeight,
        sector: asset.sector,
      },
    ],
    cashReserveWeight: config.cashReservePct,
    expectedReturnAnnualPct: +(mu * 100).toFixed(2),
    expectedVolatilityAnnualPct: +(vol * 100).toFixed(2),
    sharpeRatio: vol > 0 ? +((mu - config.riskFreeRateAnnual) / vol).toFixed(2) : 0,
    warnings: [...warnings, "Only one Shariah-compliant asset in the input — trivial allocation."],
    diagnostics: {
      nEligible: 1,
      nDroppedShariah: 0,
      nDroppedConstraint: 0,
      riskFreeRateAnnual: config.riskFreeRateAnnual,
    },
  };
}

function mean(v: number[]): number {
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function stdev(v: number[]): number {
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}
