export type AssetClass = "stock" | "etf" | "mutual_fund";
export type Region = "us" | "europe" | "asia" | "emerging" | "global";

// 11 GICS sectors (2018 revision)
export type GicsSector =
  | "tech"
  | "healthcare"
  | "financials"
  | "consumer_discretionary"
  | "consumer_staples"
  | "communication"
  | "industrials"
  | "energy"
  | "materials"
  | "utilities"
  | "real_estate"
  | "diversified"; // for multi-asset ETFs

export type MarketCapBucket = "mega" | "large" | "mid" | "small";

export type Asset = {
  symbol: string;
  nameEn: string;
  nameAr: string;
  assetClass: AssetClass;
  sector: GicsSector;
  region: Region;
  currency: string;
  // Pricing
  lastPrice: number;       // in native currency
  priceChangePct: number;  // intraday or last-session
  ytdReturn: number;       // percent
  // Fundamentals
  marketCapUsd: number;    // in USD billions
  peRatio?: number;
  dividendYield?: number;  // percent
  high52: number;
  low52: number;
  // Compliance
  shariahCompliant: boolean;
  shariahReason?: string;
  // Extended (computed from historical-data.json — undefined when no series)
  return1Y?: number;       // percent — cumulative
  return3Y?: number;       // percent — annualized
  volatility1Y?: number;   // percent — annualized
};

// ─── Customizable column registry ──────────────────────────────────────────
// Drives both display (which columns the table renders) AND filtering (which
// numeric ranges show up in the sidebar). Adding a new metric only touches
// this file + ResultsList rendering + FilterSidebar input — UI stays in lock-
// step with what's filterable.

export type ColumnKey =
  | "ytd"
  | "return1Y"
  | "return3Y"
  | "volatility1Y"
  | "peRatio"
  | "dividendYield"
  | "marketCap"
  | "purification"
  | "heldByClients"
  | "nextEarnings";

export const DEFAULT_COLUMNS: ColumnKey[] = [
  "ytd",
  "heldByClients",
  "purification",
];

export const ALL_OPTIONAL_COLUMNS: ColumnKey[] = [
  "ytd",
  "return1Y",
  "return3Y",
  "volatility1Y",
  "peRatio",
  "dividendYield",
  "marketCap",
  "heldByClients",
  "nextEarnings",
  "purification",
];

export type NumericRange = [number, number];

// Range filters keyed by ColumnKey. Empty / absent = "no filter on this field".
export type RangeFilters = Partial<Record<
  "ytd" | "return1Y" | "return3Y" | "volatility1Y" | "peRatio" | "dividendYield" | "marketCap",
  NumericRange
>>;

export type SearchFilters = {
  q: string;
  assetClasses: AssetClass[];     // empty = all
  sectors: GicsSector[];          // empty = all
  regions: Region[];              // empty = all
  marketCapBuckets: MarketCapBucket[]; // empty = all
  shariahOnly: boolean;
  ytdRange: [number, number];     // % range, e.g. [-20, 200]
  // Range filters surfaced by the Customize panel. Each is optional — only
  // applied when the advisor has enabled the corresponding column.
  ranges: RangeFilters;
  // Filter to symbols that appear in ANY of the selected watchlists.
  // Empty = no watchlist filter applied.
  watchlistIds: string[];
};

export const DEFAULT_FILTERS: SearchFilters = {
  q: "",
  assetClasses: [],
  sectors: [],
  regions: [],
  marketCapBuckets: [],
  shariahOnly: true,
  ytdRange: [-50, 200],
  ranges: {},
  watchlistIds: [],
};

export const MARKET_CAP_THRESHOLDS_USD: Record<MarketCapBucket, [number, number]> = {
  mega: [200, Infinity],   // >$200B
  large: [10, 200],        // $10B–$200B
  mid: [2, 10],            // $2B–$10B
  small: [0, 2],           // <$2B
};

export function bucketFor(marketCapUsd: number): MarketCapBucket {
  if (marketCapUsd >= 200) return "mega";
  if (marketCapUsd >= 10) return "large";
  if (marketCapUsd >= 2) return "mid";
  return "small";
}
