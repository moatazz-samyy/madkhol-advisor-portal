export type SubjectType = "client_portfolio" | "model_generic";

export type ConfidenceInterval = 50 | 80 | 95;

export const TIME_HORIZONS_MONTHS = [6, 12, 60, 120] as const;
export type HorizonMonths = (typeof TIME_HORIZONS_MONTHS)[number];

export type Scenario = {
  subjectType: SubjectType;
  subjectId: string;
  horizonMonths: HorizonMonths;
  monthlyContributionSar: number;
  monthlyWithdrawalSar: number;
  confidenceInterval: ConfidenceInterval;
  nRuns: number;
  seed: number;
};

// ─── Per-asset distribution input ──────────────────────────────────────────
// Each holding contributes a row to the simulation: its current value (SAR),
// annualized μ and σ, plus its return series (or null when we fall back to
// asset-class defaults).
export type AssetInput = {
  symbol: string;
  currentValueSar: number;
  monthlyReturnSeries: number[] | null; // null → we'll use defaults below
  assetClass: string;                    // used to pick the default
  sourceSeries: "historical" | "default";
};

// ─── Asset-class defaults for assets without historical data ───────────────
//
// Used only when a holding's symbol isn't in historical-data.json. Conservative
// asset-class-typical numbers; the projection diagnostics flag any holding that
// used these so the advisor sees what's modelled directly vs by class.
export const ASSET_CLASS_DEFAULTS: Record<string, { meanA: number; volA: number }> = {
  equity:      { meanA: 0.12, volA: 0.22 },
  stock:       { meanA: 0.12, volA: 0.22 },
  etf:         { meanA: 0.10, volA: 0.15 },
  sukuk:       { meanA: 0.04, volA: 0.06 },
  mmf:         { meanA: 0.04, volA: 0.03 },
  reit:        { meanA: 0.08, volA: 0.18 },
  commodities: { meanA: 0.06, volA: 0.18 },
};

export const SAUDI_INFLATION_ANNUAL = 0.03;

// ─── Per-month percentile series (the fan-chart payload) ──────────────────
export type PercentileSeries = {
  months: number[]; // [0, 1, 2, ...]
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
  inflationLine: number[]; // starting AuM × (1.03)^(t/12)
  // Bands derived from confidenceInterval — the UI doesn't have to recompute
  ciLower: number[]; // p_(50 - CI/2)
  ciUpper: number[]; // p_(50 + CI/2)
};

export type Aggregates = {
  medianFinalSar: number;
  lowerCISar: number;
  upperCISar: number;
  expectedAnnualReturnPct: number;
  annualVolatilityPct: number;
  probPositive: number;        // 0..1
  probBeatInflation: number;   // 0..1
  bestCaseSar: number;         // p95 final
  worstCaseSar: number;        // p5 final
  startingAumSar: number;
  warnings: string[];
};

export type ProjectionResult = {
  scenario: Scenario;
  percentiles: PercentileSeries;
  aggregates: Aggregates;
  assetsUsed: { symbol: string; sourceSeries: "historical" | "default" }[];
};
