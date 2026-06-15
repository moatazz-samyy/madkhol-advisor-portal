import type { Asset, GicsSector } from "@/lib/universal-search/types";

export type SectorKey = Exclude<GicsSector, "diversified">;

export type SectorSummary = {
  key: SectorKey;
  labelEn: string;
  labelAr: string;
  todayChangePct: number;       // cap-weighted average across compliant + non-compliant
  ytdReturnPct: number;         // cap-weighted average
  stockCount: number;
  compliantCount: number;
  totalMarketCapUsd: number;
};

export type SectorDetail = {
  key: SectorKey;
  labelEn: string;
  labelAr: string;
  summary: SectorSummary;
  stocks: Asset[];              // ordered by market cap desc
};

export type AllocationMethod = "equal" | "cap_weighted" | "custom";
