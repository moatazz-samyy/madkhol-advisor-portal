/**
 * Constraint projection. We solve the unconstrained optimization first, then
 * iteratively project onto the feasible set. For the demo's scale (≤ 20 assets,
 * a handful of constraints) this converges in a handful of iterations.
 */

import type { Vector } from "./math";
import type { GicsSector } from "@/lib/universal-search/types";

export type PerAssetBound = { min: number; max: number }; // %

export type ProjectionInput = {
  symbols: string[];
  sectors: GicsSector[];
  rawWeights: Vector;       // sums to 1.0
  targetSumPct: number;     // 99 (post cash reserve)
  sectorCaps?: Partial<Record<GicsSector, number>>; // %
  perAssetBounds?: Record<string, PerAssetBound>;   // %
};

export type ProjectionResult = {
  weightsPct: Vector;       // % — sums to targetSumPct
  iterations: number;
  feasible: boolean;
  message?: string;
};

const MAX_ITER = 50;
const TOL = 0.01; // %

/**
 * Project raw decimal weights onto the feasible set:
 *   - sum to targetSumPct (e.g. 99)
 *   - each w_i in [min_i, max_i] (or [0, targetSumPct] if no bound)
 *   - sum over each sector ≤ sectorCap_s
 *
 * Iterative projection: scale → clamp → renormalize → cap sectors → renormalize.
 * Reports infeasibility when constraint floors exceed available allocation.
 */
export function projectOntoConstraints(input: ProjectionInput): ProjectionResult {
  const {
    symbols,
    sectors,
    rawWeights,
    targetSumPct,
    sectorCaps,
    perAssetBounds,
  } = input;

  const n = rawWeights.length;
  if (n === 0) {
    return { weightsPct: [], iterations: 0, feasible: true };
  }

  // Quick feasibility check — sum of floors must fit, ceilings must cover
  const floors = symbols.map((s) => perAssetBounds?.[s]?.min ?? 0);
  const ceilings = symbols.map((s) => perAssetBounds?.[s]?.max ?? targetSumPct);
  const sumFloors = floors.reduce((a, b) => a + b, 0);
  const sumCeilings = ceilings.reduce((a, b) => a + b, 0);
  if (sumFloors > targetSumPct + TOL) {
    return {
      weightsPct: floors,
      iterations: 0,
      feasible: false,
      message: `Per-asset minimums sum to ${sumFloors.toFixed(1)}%, exceeding the ${targetSumPct}% allocation budget.`,
    };
  }
  if (sumCeilings < targetSumPct - TOL) {
    return {
      weightsPct: ceilings,
      iterations: 0,
      feasible: false,
      message: `Per-asset maximums sum to ${sumCeilings.toFixed(1)}%, below the ${targetSumPct}% allocation budget.`,
    };
  }
  // Sector cap feasibility
  if (sectorCaps) {
    let capSum = 0;
    const uniqueSectors = Array.from(new Set(sectors));
    for (const s of uniqueSectors) {
      const cap = sectorCaps[s];
      if (cap !== undefined) capSum += cap;
      else capSum += targetSumPct;
    }
    if (capSum < targetSumPct - TOL) {
      return {
        weightsPct: floors,
        iterations: 0,
        feasible: false,
        message: `Sector caps sum to ${capSum.toFixed(1)}%, below the ${targetSumPct}% allocation budget.`,
      };
    }
  }

  // Initial scale: raw → target sum
  const w = rawWeights.map((x) => x * targetSumPct);

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // 1. Clamp to bounds
    for (let i = 0; i < n; i++) {
      w[i] = Math.max(floors[i], Math.min(ceilings[i], w[i]));
    }

    // 2. Renormalize among unclamped to hit targetSum (preserving clamped)
    const currentSum = w.reduce((a, b) => a + b, 0);
    let delta = targetSumPct - currentSum;

    if (Math.abs(delta) < TOL && checkSectorCaps(symbols, sectors, w, sectorCaps).ok) {
      return { weightsPct: w, iterations: iter + 1, feasible: true };
    }

    if (Math.abs(delta) > TOL) {
      // Spread delta proportionally among assets with headroom in the right direction
      const headroom = w.map((wi, i) =>
        delta > 0 ? ceilings[i] - wi : wi - floors[i],
      );
      const totalHeadroom = headroom.reduce((a, b) => a + b, 0);
      if (totalHeadroom < Math.abs(delta) - TOL) {
        return {
          weightsPct: w,
          iterations: iter + 1,
          feasible: false,
          message: "Bounds leave no room to reach the 99% allocation target.",
        };
      }
      for (let i = 0; i < n; i++) {
        if (totalHeadroom > 0) w[i] += delta * (headroom[i] / totalHeadroom);
      }
      // Re-clamp after adjustment
      for (let i = 0; i < n; i++) {
        w[i] = Math.max(floors[i], Math.min(ceilings[i], w[i]));
      }
    }

    // 3. Sector caps: if any sector exceeds its cap, scale that sector down,
    //    then redistribute the freed weight to other sectors proportionally.
    if (sectorCaps) {
      const sectorTotals = sectorSums(sectors, w);
      let anyExcess = false;
      for (const [sec, sec_total] of Object.entries(sectorTotals)) {
        const cap = sectorCaps[sec as GicsSector];
        if (cap !== undefined && sec_total > cap + TOL) {
          anyExcess = true;
          const scale = cap / sec_total;
          for (let i = 0; i < n; i++) {
            if (sectors[i] === sec) {
              const newW = Math.max(floors[i], w[i] * scale);
              delta = w[i] - newW; // freed amount → redistribute
              w[i] = newW;
              // Redistribute delta to non-capped sectors with headroom
              const targets = symbols
                .map((_, j) => j)
                .filter(
                  (j) =>
                    sectors[j] !== sec &&
                    w[j] < ceilings[j] &&
                    (!sectorCaps[sectors[j] as GicsSector] ||
                      sectorTotals[sectors[j]] + 1 <
                        (sectorCaps[sectors[j] as GicsSector] ?? Infinity)),
                );
              const totalTargetHeadroom = targets.reduce(
                (a, j) => a + (ceilings[j] - w[j]),
                0,
              );
              if (totalTargetHeadroom > 0) {
                for (const j of targets) {
                  w[j] += delta * ((ceilings[j] - w[j]) / totalTargetHeadroom);
                }
              }
            }
          }
        }
      }
      if (!anyExcess) {
        const finalSum = w.reduce((a, b) => a + b, 0);
        if (Math.abs(finalSum - targetSumPct) < TOL) {
          return { weightsPct: w, iterations: iter + 1, feasible: true };
        }
      }
    }
  }

  const sumNow = w.reduce((a, b) => a + b, 0);
  return {
    weightsPct: w,
    iterations: MAX_ITER,
    feasible: Math.abs(sumNow - targetSumPct) < 1,
    message:
      Math.abs(sumNow - targetSumPct) >= 1
        ? "Could not fully satisfy all constraints; consider relaxing them."
        : undefined,
  };
}

function sectorSums(sectors: GicsSector[], w: Vector): Record<string, number> {
  const totals: Record<string, number> = {};
  for (let i = 0; i < w.length; i++) {
    totals[sectors[i]] = (totals[sectors[i]] ?? 0) + w[i];
  }
  return totals;
}

function checkSectorCaps(
  _symbols: string[],
  sectors: GicsSector[],
  w: Vector,
  caps?: Partial<Record<GicsSector, number>>,
): { ok: boolean } {
  if (!caps) return { ok: true };
  const totals = sectorSums(sectors, w);
  for (const [sec, cap] of Object.entries(caps)) {
    if (cap === undefined) continue;
    if ((totals[sec] ?? 0) > cap + TOL) return { ok: false };
  }
  return { ok: true };
}
