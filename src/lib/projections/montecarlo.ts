/**
 * Monte Carlo simulation engine for portfolio projections.
 *
 * For each asset in the portfolio we know:
 *   - current SAR value
 *   - annualized μ and σ (from historical data or asset-class defaults)
 *
 * We build a correlated multivariate normal sampler from the asset return
 * matrix (when historical), then for N runs × T months we draw correlated
 * monthly returns, compound forward against per-asset balances, and apply
 * contributions/withdrawals at the end of each month. At each month we record
 * the total portfolio value across all runs and later collapse to percentiles.
 *
 * The portfolio is rebalanced back to starting weights each month — the
 * standard assumption for projecting a managed portfolio. Without rebalancing,
 * winners would dominate the simulation over long horizons in unrealistic
 * ways for a typical advisor relationship.
 */

import {
  ASSET_CLASS_DEFAULTS,
  SAUDI_INFLATION_ANNUAL,
  type AssetInput,
  type PercentileSeries,
  type Aggregates,
  type ProjectionResult,
  type Scenario,
} from "./types";
import {
  cholesky,
  colMeans,
  covariance,
  gaussianSampler,
  lowerTriMatVec,
  mulberry32,
  percentileSorted,
  ridge,
} from "./math";

const COV_RIDGE = 1e-4;

export function runProjection(
  assets: AssetInput[],
  scenario: Scenario,
): ProjectionResult {
  const startingAumSar = assets.reduce((s, a) => s + a.currentValueSar, 0);
  const horizonMonths = scenario.horizonMonths;
  const nRuns = Math.min(10_000, Math.max(500, scenario.nRuns));

  // ─── Build monthly mean vector + (optionally) covariance ─────────────────
  // Only assets with historical data contribute to the joint distribution.
  // Others are simulated independently with class-default σ and μ.
  const withSeries = assets.filter((a) => a.monthlyReturnSeries !== null);
  const withoutSeries = assets.filter((a) => a.monthlyReturnSeries === null);

  let muMonthly: number[] = [];
  let L: number[][] = [];
  const nCorr = withSeries.length;

  if (nCorr > 0) {
    const months = withSeries[0].monthlyReturnSeries!.length;
    const matrix: number[][] = [];
    for (let t = 0; t < months; t++) {
      matrix.push(withSeries.map((a) => a.monthlyReturnSeries![t]));
    }
    muMonthly = colMeans(matrix);
    const cov = ridge(covariance(matrix), COV_RIDGE);
    L = cholesky(cov);
  }

  // Defaults for assets without series — μ_monthly, σ_monthly (independent draws)
  const defaultMu: number[] = withoutSeries.map((a) => {
    const d = ASSET_CLASS_DEFAULTS[a.assetClass] ?? ASSET_CLASS_DEFAULTS.equity;
    return d.meanA / 12;
  });
  const defaultSigma: number[] = withoutSeries.map((a) => {
    const d = ASSET_CLASS_DEFAULTS[a.assetClass] ?? ASSET_CLASS_DEFAULTS.equity;
    return d.volA / Math.sqrt(12);
  });

  // ─── Starting weights (held constant; we rebalance back each month) ──────
  const startWeights = assets.map(
    (a) => a.currentValueSar / Math.max(startingAumSar, 1),
  );

  // ─── Buffers ────────────────────────────────────────────────────────────
  // For each month t in 0..horizon, we record one value per run. Storage:
  // a Float64Array per month would be ideal but plain number[] works fine at
  // 10k × 120 = 1.2M cells.
  const monthlyTotals: Float64Array[] = Array.from(
    { length: horizonMonths + 1 },
    () => new Float64Array(nRuns),
  );

  const rng = mulberry32(scenario.seed);
  const gauss = gaussianSampler(rng);

  const netMonthlyCashflowSar =
    scenario.monthlyContributionSar - scenario.monthlyWithdrawalSar;

  // ─── Main MC loop ────────────────────────────────────────────────────────
  for (let run = 0; run < nRuns; run++) {
    let aum = startingAumSar;
    monthlyTotals[0][run] = aum;

    for (let t = 1; t <= horizonMonths; t++) {
      // Step 1: correlated draws for the historical-data assets
      let monthlyR = 0; // weighted portfolio return this month
      if (nCorr > 0) {
        const z: number[] = new Array(nCorr);
        for (let i = 0; i < nCorr; i++) z[i] = gauss();
        const r = lowerTriMatVec(L, z); // correlated draws (zero-mean)
        for (let i = 0; i < nCorr; i++) {
          const ri = muMonthly[i] + r[i];
          monthlyR += startWeights[assets.indexOf(withSeries[i])] * ri;
        }
      }
      // Step 2: independent default-distribution assets
      for (let j = 0; j < withoutSeries.length; j++) {
        const ri = defaultMu[j] + defaultSigma[j] * gauss();
        monthlyR += startWeights[assets.indexOf(withoutSeries[j])] * ri;
      }
      // Apply return to AuM
      aum = aum * (1 + monthlyR);
      // End-of-month cashflow (positive = contribution, negative = withdrawal)
      aum += netMonthlyCashflowSar;
      if (aum < 0) aum = 0;

      monthlyTotals[t][run] = aum;
    }
  }

  // ─── Percentile reduction ────────────────────────────────────────────────
  const months: number[] = [];
  const p5: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];
  const ciLower: number[] = [];
  const ciUpper: number[] = [];
  const inflationLine: number[] = [];

  const ciLow = (100 - scenario.confidenceInterval) / 2;
  const ciHigh = 100 - ciLow;

  for (let t = 0; t <= horizonMonths; t++) {
    months.push(t);
    const sorted = Array.from(monthlyTotals[t]).sort((a, b) => a - b);
    p5.push(percentileSorted(sorted, 5));
    p25.push(percentileSorted(sorted, 25));
    p50.push(percentileSorted(sorted, 50));
    p75.push(percentileSorted(sorted, 75));
    p95.push(percentileSorted(sorted, 95));
    ciLower.push(percentileSorted(sorted, ciLow));
    ciUpper.push(percentileSorted(sorted, ciHigh));
    inflationLine.push(
      startingAumSar * Math.pow(1 + SAUDI_INFLATION_ANNUAL, t / 12),
    );
  }

  const percentiles: PercentileSeries = {
    months,
    p5,
    p25,
    p50,
    p75,
    p95,
    ciLower,
    ciUpper,
    inflationLine,
  };

  // ─── Aggregates ──────────────────────────────────────────────────────────
  const final = Array.from(monthlyTotals[horizonMonths]).sort((a, b) => a - b);
  const medianFinal = percentileSorted(final, 50);
  const lowerCI = percentileSorted(final, ciLow);
  const upperCI = percentileSorted(final, ciHigh);
  const horizonYears = horizonMonths / 12;
  const inflationFinal =
    startingAumSar * Math.pow(1 + SAUDI_INFLATION_ANNUAL, horizonYears);

  let countPositive = 0;
  let countBeatInflation = 0;
  for (const v of final) {
    if (v > startingAumSar) countPositive++;
    if (v > inflationFinal) countBeatInflation++;
  }

  // CAGR from median, regardless of contributions (contributions are reflected
  // in the median itself, so we report the realized growth of the portfolio).
  const cagr = horizonYears > 0
    ? Math.pow(medianFinal / Math.max(startingAumSar, 1), 1 / horizonYears) - 1
    : 0;
  // Portfolio vol — use the standard deviation of the cross-section at
  // horizon end, annualized as an approximation.
  const finalMean = final.reduce((s, v) => s + v, 0) / final.length;
  const finalVariance =
    final.reduce((s, v) => s + (v - finalMean) ** 2, 0) / (final.length - 1);
  const finalStd = Math.sqrt(finalVariance);
  const annualVol = horizonYears > 0
    ? (finalStd / Math.max(finalMean, 1)) / Math.sqrt(horizonYears)
    : 0;

  const warnings: string[] = [];
  if (withoutSeries.length > 0) {
    warnings.push(
      `Used asset-class defaults for ${withoutSeries.length} holding(s) without historical data.`,
    );
  }

  const aggregates: Aggregates = {
    medianFinalSar: +medianFinal.toFixed(0),
    lowerCISar: +lowerCI.toFixed(0),
    upperCISar: +upperCI.toFixed(0),
    expectedAnnualReturnPct: +(cagr * 100).toFixed(2),
    annualVolatilityPct: +(annualVol * 100).toFixed(2),
    probPositive: +(countPositive / nRuns).toFixed(3),
    probBeatInflation: +(countBeatInflation / nRuns).toFixed(3),
    bestCaseSar: +percentileSorted(final, 95).toFixed(0),
    worstCaseSar: +percentileSorted(final, 5).toFixed(0),
    startingAumSar: +startingAumSar.toFixed(0),
    warnings,
  };

  return {
    scenario,
    percentiles,
    aggregates,
    assetsUsed: assets.map((a) => ({
      symbol: a.symbol,
      sourceSeries: a.sourceSeries,
    })),
  };
}
