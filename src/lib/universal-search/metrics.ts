/**
 * Per-asset extended metrics derived from the 36-month historical returns in
 * `optimizer/historical-data.json`. Computed once at module load — adding a
 * symbol to the dataset auto-populates these without a seed script change.
 *
 * Used by the Search page's "Customize columns" feature (1Y/3Y return,
 * annualized volatility). Assets without a series get `undefined` and the UI
 * shows an em-dash.
 */

import historical from "@/lib/optimizer/historical-data.json";

export type AssetMetrics = {
  return1Y?: number;       // percent — last 12 months cumulative
  return3Y?: number;       // percent — annualized over 36 months
  volatility1Y?: number;   // percent — annualized stdev of last 12 monthly returns
};

const series = (historical.series as Array<{ symbol: string; monthly: number[] }>);

const METRICS_BY_SYMBOL = new Map<string, AssetMetrics>(
  series.map((s) => [s.symbol, computeFor(s.monthly)]),
);

function computeFor(monthly: number[]): AssetMetrics {
  if (monthly.length < 12) return {};
  const last12 = monthly.slice(-12);
  const last36 = monthly.slice(-36);

  // Cumulative 1Y: product(1 + r_i) − 1
  const cum1Y = last12.reduce((p, r) => p * (1 + r), 1) - 1;

  // Annualized 3Y CAGR: cumProduct^(1/years) − 1
  const cum3Y = last36.reduce((p, r) => p * (1 + r), 1);
  const years = last36.length / 12;
  const cagr3Y = Math.pow(cum3Y, 1 / years) - 1;

  // Annualized volatility from last 12 monthly returns
  const mean12 = last12.reduce((s, r) => s + r, 0) / last12.length;
  const variance =
    last12.reduce((s, r) => s + (r - mean12) ** 2, 0) / (last12.length - 1);
  const monthlyStd = Math.sqrt(variance);
  const annualVol = monthlyStd * Math.sqrt(12);

  return {
    return1Y: round(cum1Y * 100),
    return3Y: round(cagr3Y * 100),
    volatility1Y: round(annualVol * 100),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function metricsFor(symbol: string): AssetMetrics {
  return METRICS_BY_SYMBOL.get(symbol) ?? {};
}
