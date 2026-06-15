import { runProjection } from "../src/lib/projections/montecarlo";
import historical from "../src/lib/optimizer/historical-data.json";

const series = (historical.series as Array<{ symbol: string; monthly: number[] }>);
const seriesBySymbol = new Map(series.map((s) => [s.symbol, s.monthly]));

// 5-asset balanced portfolio worth 1M SAR
const assets = [
  { symbol: "SPUS", currentValueSar: 350_000, monthlyReturnSeries: seriesBySymbol.get("SPUS")!, assetClass: "etf", sourceSeries: "historical" as const },
  { symbol: "AAPL", currentValueSar: 200_000, monthlyReturnSeries: seriesBySymbol.get("AAPL")!, assetClass: "stock", sourceSeries: "historical" as const },
  { symbol: "MSFT", currentValueSar: 150_000, monthlyReturnSeries: seriesBySymbol.get("MSFT")!, assetClass: "stock", sourceSeries: "historical" as const },
  { symbol: "SPSK", currentValueSar: 200_000, monthlyReturnSeries: seriesBySymbol.get("SPSK")!, assetClass: "etf", sourceSeries: "historical" as const },
  { symbol: "JNJ",  currentValueSar: 100_000, monthlyReturnSeries: seriesBySymbol.get("JNJ")!, assetClass: "stock", sourceSeries: "historical" as const },
];

const horizons = [6, 12, 60, 120] as const;
console.log("seed=12345, nRuns=10000, contributions=0");
console.log("Starting AuM: 1,000,000 SAR\n");

for (const h of horizons) {
  const r = runProjection(assets, {
    subjectType: "client_portfolio",
    subjectId: "test",
    horizonMonths: h,
    monthlyContributionSar: 0,
    monthlyWithdrawalSar: 0,
    confidenceInterval: 80,
    nRuns: 10_000,
    seed: 12345,
  });
  const a = r.aggregates;
  const yr = h / 12;
  console.log(
    `${h}mo (${yr}yr): median=${a.medianFinalSar.toLocaleString()} ` +
    `CI80=[${a.lowerCISar.toLocaleString()}, ${a.upperCISar.toLocaleString()}] ` +
    `expRet=${a.expectedAnnualReturnPct}% vol=${a.annualVolatilityPct}% ` +
    `P(positive)=${(a.probPositive * 100).toFixed(0)}% ` +
    `P(beatInflation)=${(a.probBeatInflation * 100).toFixed(0)}%`,
  );
}

console.log("\nReproducibility check: same seed → identical median?");
const r1 = runProjection(assets, {
  subjectType: "client_portfolio", subjectId: "test", horizonMonths: 60,
  monthlyContributionSar: 0, monthlyWithdrawalSar: 0,
  confidenceInterval: 80, nRuns: 10_000, seed: 42,
});
const r2 = runProjection(assets, {
  subjectType: "client_portfolio", subjectId: "test", horizonMonths: 60,
  monthlyContributionSar: 0, monthlyWithdrawalSar: 0,
  confidenceInterval: 80, nRuns: 10_000, seed: 42,
});
console.log(`  Run 1 median: ${r1.aggregates.medianFinalSar.toLocaleString()}`);
console.log(`  Run 2 median: ${r2.aggregates.medianFinalSar.toLocaleString()}`);
console.log(`  Match: ${r1.aggregates.medianFinalSar === r2.aggregates.medianFinalSar}`);

console.log("\nContributions impact: 5y, no contrib vs 5k SAR/mo contrib");
const noContrib = runProjection(assets, {
  subjectType: "client_portfolio", subjectId: "test", horizonMonths: 60,
  monthlyContributionSar: 0, monthlyWithdrawalSar: 0,
  confidenceInterval: 80, nRuns: 10_000, seed: 999,
});
const withContrib = runProjection(assets, {
  subjectType: "client_portfolio", subjectId: "test", horizonMonths: 60,
  monthlyContributionSar: 5000, monthlyWithdrawalSar: 0,
  confidenceInterval: 80, nRuns: 10_000, seed: 999,
});
console.log(`  No contrib median: ${noContrib.aggregates.medianFinalSar.toLocaleString()}`);
console.log(`  With 5k/mo median: ${withContrib.aggregates.medianFinalSar.toLocaleString()}`);
console.log(`  Diff: ${(withContrib.aggregates.medianFinalSar - noContrib.aggregates.medianFinalSar).toLocaleString()} (expected: ≈ 300k from 60 × 5k)`);

const t0 = Date.now();
runProjection(assets, {
  subjectType: "client_portfolio", subjectId: "test", horizonMonths: 120,
  monthlyContributionSar: 0, monthlyWithdrawalSar: 0,
  confidenceInterval: 80, nRuns: 10_000, seed: 1,
});
console.log(`\nWall-clock for 10y × 10k runs × 5 assets: ${Date.now() - t0}ms`);
