import { runOptimization } from "../src/lib/optimizer/run";
import type { OptimizationConfig } from "../src/lib/optimizer/types";
import { ASSETS } from "../src/lib/universal-search/data";

const symbols = ["AAPL", "MSFT", "GOOGL", "NVDA", "JNJ", "LLY", "COST", "XOM", "SPSK"];
const assets = symbols
  .map((s) => ASSETS.find((a) => a.symbol === s)!)
  .map((a) => ({
    symbol: a.symbol,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    sector: a.sector,
    shariahCompliant: a.shariahCompliant,
    marketCapUsd: a.marketCapUsd,
  }));

const base: OptimizationConfig = {
  method: "equal_weight",
  riskTolerance: 0.5,
  riskFreeRateAnnual: 0.04,
  enforceShariah: true,
  cashReservePct: 1,
};

for (const m of ["equal_weight", "mean_variance", "risk_parity", "black_litterman"] as const) {
  const r = runOptimization(assets, { ...base, method: m });
  console.log(`\n--- ${m} ---`);
  console.log(`Sum weights: ${r.weights.reduce((s, w) => s + w.weight, 0).toFixed(2)}% + ${r.cashReserveWeight}% cash`);
  console.log(`Return: ${r.expectedReturnAnnualPct}%  Vol: ${r.expectedVolatilityAnnualPct}%  Sharpe: ${r.sharpeRatio}`);
  r.weights.slice().sort((a, b) => b.weight - a.weight).forEach((w) =>
    console.log(`  ${w.symbol.padEnd(6)} ${w.weight.toFixed(2)}%   ${w.sector}`),
  );
  if (r.warnings.length) console.log("  warnings:", r.warnings.join(" | "));
}

// Sector cap test: cap tech at 30
const capped = runOptimization(assets, {
  ...base,
  method: "mean_variance",
  riskTolerance: 0.7,
  sectorCaps: { tech: 30 },
});
console.log("\n--- mean_variance with tech ≤ 30% ---");
console.log(`Sum: ${capped.weights.reduce((s, w) => s + w.weight, 0).toFixed(2)}%`);
const techTotal = capped.weights.filter((w) => w.sector === "tech").reduce((s, w) => s + w.weight, 0);
console.log(`Tech total: ${techTotal.toFixed(2)}%`);
capped.weights.slice().sort((a, b) => b.weight - a.weight).forEach((w) =>
  console.log(`  ${w.symbol.padEnd(6)} ${w.weight.toFixed(2)}%   ${w.sector}`),
);

// Infeasible test: per-asset min sums to > 99
const infeasible = runOptimization(assets.slice(0, 3), {
  ...base,
  perAssetBounds: { AAPL: { min: 60, max: 99 }, MSFT: { min: 50, max: 99 } },
});
console.log("\n--- infeasible (mins 60+50 > 99) ---");
console.log("warnings:", infeasible.warnings);

// Non-Shariah mixed in
const withNoncompliant = runOptimization(
  [...assets, ASSETS.find((a) => a.symbol === "JPM")!].map((a) => ({
    symbol: a.symbol,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    sector: a.sector,
    shariahCompliant: a.shariahCompliant,
    marketCapUsd: a.marketCapUsd,
  })),
  { ...base, method: "equal_weight" },
);
console.log("\n--- with JPM (non-Shariah) in input ---");
console.log("warnings:", withNoncompliant.warnings);
console.log("JPM in output?", withNoncompliant.weights.some((w) => w.symbol === "JPM"));
