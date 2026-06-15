/**
 * Math primitives for Monte Carlo projections:
 *  - Mulberry32 seeded PRNG → identical seed = identical run.
 *  - Box-Muller for univariate standard normals.
 *  - Cholesky decomposition (lower-triangular L such that L Lᵀ = Σ).
 *  - Sample covariance / mean from a returns matrix.
 *
 * Sized for matrices ≤ 30 × 30 (realistic ceiling for a portfolio). No external
 * dependencies.
 */

export type Vector = number[];
export type Matrix = number[][];

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a sampler that produces standard normal draws using Box-Muller. */
export function gaussianSampler(rng: () => number) {
  let cached: number | null = null;
  return () => {
    if (cached !== null) {
      const v = cached;
      cached = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    const angle = 2 * Math.PI * v;
    cached = mag * Math.sin(angle);
    return mag * Math.cos(angle);
  };
}

/**
 * Sample mean of each column (asset). Each row of `returns` = one month,
 * each column = one asset.
 */
export function colMeans(returns: Matrix): Vector {
  const rows = returns.length;
  const cols = returns[0].length;
  const out: Vector = new Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    let s = 0;
    for (let r = 0; r < rows; r++) s += returns[r][c];
    out[c] = s / rows;
  }
  return out;
}

/**
 * Unbiased sample covariance (divides by n - 1). Rows = months, cols = assets.
 */
export function covariance(returns: Matrix): Matrix {
  const rows = returns.length;
  const cols = returns[0].length;
  const means = colMeans(returns);
  const C: Matrix = Array.from({ length: cols }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      let s = 0;
      for (let r = 0; r < rows; r++) {
        s += (returns[r][i] - means[i]) * (returns[r][j] - means[j]);
      }
      const v = s / (rows - 1);
      C[i][j] = v;
      C[j][i] = v;
    }
  }
  return C;
}

/**
 * Add λ to the diagonal so the matrix stays positive-definite under tiny
 * numerical perturbations from finite-sample covariance.
 */
export function ridge(M: Matrix, lambda: number): Matrix {
  return M.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)));
}

/**
 * Cholesky decomposition. Returns lower-triangular L such that L · Lᵀ = M.
 * Adds a tiny adaptive ridge if a non-positive diagonal pops up — safer than
 * throwing in the middle of a 10k-run simulation.
 */
export function cholesky(M: Matrix): Matrix {
  const n = M.length;
  const L: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  // Copy M into a working matrix we can perturb if needed
  const A = M.map((row) => row.slice());

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = A[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (sum <= 0) {
          // Tiny adaptive ridge — fall back to a positive value
          sum = 1e-10;
        }
        L[i][i] = Math.sqrt(sum);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  return L;
}

/** y = L · x  (lower-triangular matrix-vector product, O(n²/2)). */
export function lowerTriMatVec(L: Matrix, x: Vector): Vector {
  const n = L.length;
  const out: Vector = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j <= i; j++) s += L[i][j] * x[j];
    out[i] = s;
  }
  return out;
}

/** dot product, kept here so callers don't reach into other libs. */
export function dot(a: Vector, b: Vector): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * Percentile of a sorted array. Uses linear interpolation between adjacent
 * order statistics (R type 7 / Excel-like). Caller must sort first.
 */
export function percentileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  const frac = rank - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}
