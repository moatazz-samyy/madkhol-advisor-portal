import type { GicsSector } from "@/lib/universal-search/types";

export type OptimizationMethod =
  | "mean_variance"
  | "risk_parity"
  | "equal_weight"
  | "black_litterman";

export type OptimizerAssetInput = {
  symbol: string;
  nameEn: string;
  nameAr: string;
  sector: GicsSector;
  shariahCompliant: boolean;
  marketCapUsd: number;
  currentWeight?: number; // % — populated when source has existing weights
};

export type OptimizationConfig = {
  method: OptimizationMethod;
  // 0 = max conservatism (min-variance), 1 = max aggression (max-Sharpe / leveraged tilt)
  riskTolerance: number;
  riskFreeRateAnnual: number; // decimal — default 0.04
  // Constraints
  enforceShariah: true;       // locked ON
  cashReservePct: 1;          // locked at 1%
  sectorCaps?: Partial<Record<GicsSector, number>>; // % per sector
  perAssetBounds?: Record<string, { min: number; max: number }>; // % per symbol
};

export type OptimizationWeight = {
  symbol: string;
  weight: number;          // % (sums to 99%)
  currentWeight?: number;  // %
  sector: GicsSector;
};

export type OptimizationResult = {
  method: OptimizationMethod;
  weights: OptimizationWeight[];
  cashReserveWeight: number;   // % — always 1%
  expectedReturnAnnualPct: number;
  expectedVolatilityAnnualPct: number;
  sharpeRatio: number;
  warnings: string[];
  // Internal diagnostics for the panel to render
  diagnostics: {
    nEligible: number;
    nDroppedShariah: number;
    nDroppedConstraint: number;
    iterations?: number;
    converged?: boolean;
    riskFreeRateAnnual: number;
  };
};
