/**
 * Optional Finnhub adapter. Active only when FINNHUB_API_KEY is set.
 *
 * Free tier: 60 req/min. We never call from the client; results are cached at
 * the Next.js fetch layer with a 60s TTL to absorb burst traffic during the
 * demo and stay well under the rate limit.
 *
 * Production path: swap this file for an Alpaca Market Data adapter — Alpaca's
 * v2 REST has equivalent endpoints (`/v1/symbols/lookup`, `/v2/stocks/{symbol}/snapshots`,
 * `/v2/stocks/{symbol}/bars`) and the same shape; only the URL and auth header change.
 */

export function isFinnhubEnabled(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY);
}

type FinnhubQuote = {
  c: number;  // current
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  d: number;  // change
  dp: number; // change pct
};

type FinnhubCandle = {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: "ok" | "no_data";
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function f<T>(path: string): Promise<T | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const url = `${FINNHUB_BASE}${path}${path.includes("?") ? "&" : "?"}token=${key}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchLiveQuote(symbol: string) {
  const q = await f<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!q || q.c === 0) return null;
  return {
    lastPrice: q.c,
    priceChangePct: q.dp,
    high: q.h,
    low: q.l,
    open: q.o,
    previousClose: q.pc,
  };
}

export async function fetchLiveCandles(symbol: string, fromUnix: number, toUnix: number) {
  const c = await f<FinnhubCandle>(
    `/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${fromUnix}&to=${toUnix}`,
  );
  if (!c || c.s !== "ok") return null;
  return c.t.map((t, i) => ({
    day: i,
    timestamp: t * 1000,
    price: c.c[i],
  }));
}
