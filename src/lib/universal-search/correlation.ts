/**
 * Pearson correlation between monthly return series in historical-data.json.
 * Used by the Compare view's Correlation Matrix tab.
 *
 * Returns NaN for any pair where one or both symbols don't have a series — the
 * UI renders that as an em-dash.
 */

import historical from "@/lib/optimizer/historical-data.json";

const SERIES_BY_SYMBOL = new Map<string, number[]>(
  (historical.series as Array<{ symbol: string; monthly: number[] }>).map(
    (s) => [s.symbol, s.monthly],
  ),
);

export function getSeries(symbol: string): number[] | null {
  return SERIES_BY_SYMBOL.get(symbol) ?? null;
}

export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return NaN;
  const ax = a.slice(-n);
  const bx = b.slice(-n);
  const meanA = ax.reduce((s, v) => s + v, 0) / n;
  const meanB = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = ax[i] - meanA;
    const db = bx[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  if (denA === 0 || denB === 0) return NaN;
  return num / Math.sqrt(denA * denB);
}

export function correlationMatrix(symbols: string[]): number[][] {
  const seriesArr = symbols.map((s) => getSeries(s));
  const n = symbols.length;
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(1);
      } else if (!seriesArr[i] || !seriesArr[j]) {
        row.push(NaN);
      } else {
        row.push(pearson(seriesArr[i]!, seriesArr[j]!));
      }
    }
    m.push(row);
  }
  return m;
}

/**
 * Normalized price series — start each symbol at 100, compound monthly returns.
 * Returns null entries where the series isn't available.
 */
export function normalizedSeries(
  symbols: string[],
  startValue = 100,
): { month: number; values: Record<string, number | null> }[] {
  const seriesBySym = new Map(
    symbols.map((s) => [s, getSeries(s)] as const),
  );
  const maxLen = Math.max(
    ...symbols.map((s) => seriesBySym.get(s)?.length ?? 0),
    0,
  );
  if (maxLen === 0) return [];

  const out: { month: number; values: Record<string, number | null> }[] = [];

  // t = 0 (start)
  const initial: Record<string, number | null> = {};
  for (const s of symbols) {
    initial[s] = seriesBySym.get(s) ? startValue : null;
  }
  out.push({ month: 0, values: initial });

  // Compound forward
  const running: Record<string, number | null> = { ...initial };
  for (let t = 0; t < maxLen; t++) {
    for (const s of symbols) {
      const series = seriesBySym.get(s);
      if (series && t < series.length && running[s] !== null) {
        running[s] = +(running[s]! * (1 + series[t])).toFixed(2);
      }
    }
    out.push({ month: t + 1, values: { ...running } });
  }
  return out;
}
