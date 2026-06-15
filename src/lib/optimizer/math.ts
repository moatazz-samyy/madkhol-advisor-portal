/**
 * Tiny matrix helpers for the optimizer. Sized for N ≤ 30 assets which is the
 * realistic ceiling on a model portfolio. No external dependencies.
 */

export type Matrix = number[][];
export type Vector = number[];

export function zeros(n: number): Vector {
  return new Array(n).fill(0);
}

export function ones(n: number): Vector {
  return new Array(n).fill(1);
}

export function transpose(A: Matrix): Matrix {
  const m = A.length;
  const n = A[0].length;
  const T: Matrix = Array.from({ length: n }, () => new Array<number>(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  }
  return T;
}

export function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const n = B[0].length;
  const k = B.length;
  const C: Matrix = Array.from({ length: m }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += A[i][p] * B[p][j];
      C[i][j] = s;
    }
  }
  return C;
}

export function matVec(A: Matrix, v: Vector): Vector {
  const n = A.length;
  const out: Vector = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) s += A[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

export function dot(a: Vector, b: Vector): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function scalarMul(v: Vector, k: number): Vector {
  return v.map((x) => x * k);
}

export function vecAdd(a: Vector, b: Vector): Vector {
  return a.map((x, i) => x + b[i]);
}

/** Gauss-Jordan inverse for small dense matrices. Throws if singular. */
export function invert(A: Matrix): Matrix {
  const n = A.length;
  // Build [A | I]
  const M: Matrix = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    // Pivot: largest abs in column i, from row i down
    let pivotRow = i;
    let pivotVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > pivotVal) {
        pivotRow = r;
        pivotVal = Math.abs(M[r][i]);
      }
    }
    if (pivotVal < 1e-12) {
      throw new Error("Matrix is singular or near-singular — cannot invert.");
    }
    if (pivotRow !== i) [M[i], M[pivotRow]] = [M[pivotRow], M[i]];

    // Normalize pivot row
    const p = M[i][i];
    for (let c = 0; c < 2 * n; c++) M[i][c] /= p;

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = M[r][i];
      if (factor === 0) continue;
      for (let c = 0; c < 2 * n; c++) M[r][c] -= factor * M[i][c];
    }
  }

  return M.map((row) => row.slice(n));
}

/** Add λI to a matrix in place — used to regularize ill-conditioned covariance. */
export function ridge(A: Matrix, lambda: number): Matrix {
  return A.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)));
}

// ---- Statistics ----

/** Mean of each column of a matrix (each column = an asset, each row = a month). */
export function colMeans(M: Matrix): Vector {
  const rows = M.length;
  const cols = M[0].length;
  const out: Vector = new Array<number>(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    let s = 0;
    for (let r = 0; r < rows; r++) s += M[r][c];
    out[c] = s / rows;
  }
  return out;
}

/** Sample covariance matrix. Each column of M = an asset's return series. */
export function covariance(M: Matrix): Matrix {
  const rows = M.length;
  const cols = M[0].length;
  const means = colMeans(M);
  const C: Matrix = Array.from({ length: cols }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      let s = 0;
      for (let r = 0; r < rows; r++) s += (M[r][i] - means[i]) * (M[r][j] - means[j]);
      const v = s / (rows - 1);
      C[i][j] = v;
      C[j][i] = v;
    }
  }
  return C;
}

/** Annualize a covariance matrix computed from monthly returns. */
export function annualizeCov(C: Matrix): Matrix {
  return C.map((row) => row.map((v) => v * 12));
}

/** Annualize a mean vector computed from monthly returns. */
export function annualizeMean(mu: Vector): Vector {
  return mu.map((v) => v * 12);
}

/** Vector L1 norm. */
export function sum(v: Vector): number {
  let s = 0;
  for (const x of v) s += x;
  return s;
}

/** Multiply each element so the vector sums to `target`. */
export function normalizeToSum(v: Vector, target: number): Vector {
  const s = sum(v);
  if (Math.abs(s) < 1e-12) return v.slice();
  return v.map((x) => (x / s) * target);
}
