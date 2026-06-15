/**
 * Optimization methods. Each takes annualized μ + Σ and returns raw weights
 * that sum to 1.0 (constraint-free). The orchestrator handles constraint
 * projection and rescaling to 99%.
 */

import {
  covariance,
  annualizeCov,
  annualizeMean,
  colMeans,
  invert,
  matVec,
  ones,
  ridge,
  scalarMul,
  sum,
  dot,
  normalizeToSum,
} from "./math";
import type { Matrix, Vector } from "./math";

const COV_RIDGE = 1e-4; // small regularization so Σ stays invertible

export function annualizedStats(returnsMatrix: Matrix) {
  const muMonthly = colMeans(returnsMatrix);
  const covMonthly = covariance(returnsMatrix);
  const mu = annualizeMean(muMonthly);
  const cov = annualizeCov(ridge(covMonthly, COV_RIDGE));
  return { mu, cov };
}

// ---- 1. Equal-Weight ----

export function equalWeight(n: number): Vector {
  if (n === 0) return [];
  return new Array(n).fill(1 / n);
}

// ---- 2. Mean-Variance: interpolate min-var → max-Sharpe by risk tolerance ----

/**
 * Min-variance tangency: w* ∝ Σ⁻¹ · 1
 */
export function minVariance(cov: Matrix): Vector {
  const n = cov.length;
  const invCov = invert(cov);
  const w = matVec(invCov, ones(n));
  return normalizeToSum(w, 1);
}

/**
 * Max-Sharpe tangency: w* ∝ Σ⁻¹ · (μ - rf · 1)
 */
export function maxSharpe(mu: Vector, cov: Matrix, riskFreeRateAnnual: number): Vector {
  const excess = mu.map((m) => m - riskFreeRateAnnual);
  const invCov = invert(cov);
  const w = matVec(invCov, excess);
  // If excess is all negative, max-Sharpe is degenerate — fall back to min-var
  if (sum(w) <= 0) return minVariance(cov);
  return normalizeToSum(w, 1);
}

/**
 * Mean-variance with risk tolerance ∈ [0, 1]:
 *  0   → pure min-variance (most conservative diversification)
 *  1   → pure max-Sharpe   (aggressive)
 *  0.5 → equal blend
 */
export function meanVariance(
  mu: Vector,
  cov: Matrix,
  riskTolerance: number,
  riskFreeRateAnnual: number,
): Vector {
  const wMin = minVariance(cov);
  const wMax = maxSharpe(mu, cov, riskFreeRateAnnual);
  const t = Math.max(0, Math.min(1, riskTolerance));
  const w = wMin.map((wm, i) => (1 - t) * wm + t * wMax[i]);
  return normalizeToSum(w, 1);
}

// ---- 3. Risk Parity ----

/**
 * Equal risk contribution via fixed-point iteration.
 * Marginal contribution to portfolio risk: mc_i = (Σw)_i
 * Risk contribution: rc_i = w_i · mc_i
 * Goal: rc_i = (wᵀΣw) / n for all i
 *
 * Update rule (Spinu 2013, simplified):
 *   w_i ← w_i · target / rc_i, then renormalize.
 */
export function riskParity(cov: Matrix, maxIter = 60, tol = 1e-4): {
  weights: Vector;
  iterations: number;
  converged: boolean;
} {
  const n = cov.length;
  if (n === 0) return { weights: [], iterations: 0, converged: true };
  // Start from inverse-vol weights — close to risk parity
  const sigmas = cov.map((row, i) => Math.sqrt(Math.max(row[i], 1e-12)));
  let w: Vector = sigmas.map((s) => 1 / s);
  w = normalizeToSum(w, 1);

  for (let iter = 0; iter < maxIter; iter++) {
    const mc = matVec(cov, w);                    // marginal contributions
    const rc = w.map((wi, i) => wi * mc[i]);      // risk contributions
    const totalRisk = sum(rc);
    const targetRC = totalRisk / n;
    const adjusted = w.map((wi, i) => wi * (targetRC / Math.max(rc[i], 1e-12)));
    const wNext = normalizeToSum(adjusted, 1);
    const delta = wNext.reduce((s, x, i) => s + Math.abs(x - w[i]), 0);
    w = wNext;
    if (delta < tol) return { weights: w, iterations: iter + 1, converged: true };
  }
  return { weights: w, iterations: maxIter, converged: false };
}

// ---- 4. Black-Litterman (simplified) ----

/**
 * Simplified Black-Litterman with NO advisor views and a market-cap prior.
 *  - Equilibrium prior: π = λ · Σ · w_market
 *  - Posterior = prior (since no views)
 *  - Optimal: w ∝ Σ⁻¹ · π, which recovers w_market by construction
 *
 * To make it more interesting than pure cap-weighting, we shrink toward
 * equal-weight by a factor τ ∈ [0,1] so the result diverges from a pure market
 * cap portfolio (more diversification in the demo).
 */
export function blackLittermanCapWeighted(
  marketCaps: Vector,
  cov: Matrix,
  shrinkTowardEqual = 0.35,
): Vector {
  const n = marketCaps.length;
  if (n === 0) return [];
  const totalCap = sum(marketCaps);
  const wMarket = totalCap > 0 ? marketCaps.map((c) => c / totalCap) : ones(n).map((x) => x / n);
  const wEqual = ones(n).map((x) => x / n);
  const blended = wMarket.map((m, i) => (1 - shrinkTowardEqual) * m + shrinkTowardEqual * wEqual[i]);
  void cov; // covariance feeds into the equilibrium prior but cancels in this simplified form
  return normalizeToSum(blended, 1);
}

// ---- Portfolio statistics (for the result panel) ----

export function portfolioReturn(weights: Vector, mu: Vector): number {
  return dot(weights, mu);
}

export function portfolioVolatility(weights: Vector, cov: Matrix): number {
  return Math.sqrt(Math.max(0, dot(weights, matVec(cov, weights))));
}

export function sharpe(ret: number, vol: number, rf: number): number {
  if (vol < 1e-6) return 0;
  return (ret - rf) / vol;
}

// Re-exported for callers who want the raw helpers
export { normalizeToSum, scalarMul };
