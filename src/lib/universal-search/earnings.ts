/**
 * Earnings calendar lookups. Mock-data backed for the demo — production swap
 * is Finnhub / Polygon / IEX. The Search page surfaces this as an optional
 * column ("Next earnings") that resolves to ISO date or null.
 */

import calendar from "./earnings-calendar.json";

export type EarningsEntry = {
  symbol: string;
  date: string;          // ISO yyyy-mm-dd
  type: string;          // e.g. "Q2 2026"
  estEps: number;
  consensusCount: number;
};

const ENTRIES_BY_SYMBOL = new Map<string, EarningsEntry>(
  (calendar.entries as EarningsEntry[]).map((e) => [e.symbol, e]),
);

export function earningsFor(symbol: string): EarningsEntry | null {
  return ENTRIES_BY_SYMBOL.get(symbol) ?? null;
}

// Days from now → small int. Negative means past (shouldn't happen in the demo
// because the mock dates are forward-looking, but defensive).
export function daysUntilEarnings(
  symbol: string,
  now = new Date("2026-06-11"),
): number | null {
  const entry = earningsFor(symbol);
  if (!entry) return null;
  const target = new Date(entry.date);
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
