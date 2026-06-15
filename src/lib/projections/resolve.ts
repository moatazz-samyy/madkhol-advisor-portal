/**
 * Resolves a "subject" (client portfolio or generic model) into the list of
 * `AssetInput`s the Monte Carlo engine consumes. Pulls historical series from
 * `historical-data.json` where available and falls back to asset-class
 * defaults for everything else.
 */

import { prisma } from "@/lib/prisma";
import historical from "@/lib/optimizer/historical-data.json";
import { ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";
import type { AssetInput, SubjectType } from "./types";

const seriesBySymbol = new Map<string, number[]>(
  (historical.series as Array<{ symbol: string; monthly: number[] }>).map(
    (s) => [s.symbol, s.monthly],
  ),
);

function assetClassFor(fundAssetClass: string, symbol: string | null): string {
  if (symbol) {
    const asset = ASSETS_BY_SYMBOL.get(symbol);
    if (asset) return asset.assetClass; // "stock" | "etf" | "mutual_fund"
  }
  return fundAssetClass; // equity | sukuk | mmf | reit | etf | commodities
}

function buildAssetInput(args: {
  symbol: string | null;
  fundId: string;
  fundAssetClass: string;
  currentValueSar: number;
}): AssetInput {
  const lookupSymbol = args.symbol ?? args.fundId;
  const series = args.symbol ? seriesBySymbol.get(args.symbol) ?? null : null;
  const assetClass = assetClassFor(args.fundAssetClass, args.symbol);
  return {
    symbol: lookupSymbol,
    currentValueSar: args.currentValueSar,
    monthlyReturnSeries: series,
    assetClass,
    sourceSeries: series ? "historical" : "default",
  };
}

export type ResolvedSubject = {
  label: string;
  labelAr: string;
  assets: AssetInput[];
  startingAumSar: number;
};

export async function resolveSubject(
  advisorId: string,
  subjectType: SubjectType,
  subjectId: string,
): Promise<ResolvedSubject | null> {
  if (subjectType === "client_portfolio") {
    const c = await prisma.client.findFirst({
      where: { id: subjectId, advisorId },
      include: {
        portfolio: { include: { holdings: { include: { fund: true } } } },
      },
    });
    if (!c?.portfolio) return null;
    const assets: AssetInput[] = c.portfolio.holdings.map((h) =>
      buildAssetInput({
        symbol: h.fund.symbol,
        fundId: h.fund.id,
        fundAssetClass: h.fund.assetClass,
        currentValueSar: h.currentValue,
      }),
    );
    return {
      label: c.name,
      labelAr: c.nameAr,
      assets,
      startingAumSar: c.portfolio.totalAumSar,
    };
  }

  if (subjectType === "model_generic") {
    const m = await prisma.modelPortfolio.findFirst({
      where: { id: subjectId, advisorId },
    });
    if (!m) return null;
    const targets = JSON.parse(m.targetHoldings) as Record<string, number>;
    const fundIds = Object.keys(targets);
    const funds = await prisma.fund.findMany({ where: { id: { in: fundIds } } });
    // Notional AuM = 100k SAR so weights map cleanly to per-asset values
    const notionalAum = 100_000;
    const assets: AssetInput[] = funds.map((f) =>
      buildAssetInput({
        symbol: f.symbol,
        fundId: f.id,
        fundAssetClass: f.assetClass,
        currentValueSar: notionalAum * (targets[f.id] / 100),
      }),
    );
    return {
      label: m.name,
      labelAr: m.nameAr,
      assets,
      startingAumSar: notionalAum * 0.99,
    };
  }

  return null;
}
