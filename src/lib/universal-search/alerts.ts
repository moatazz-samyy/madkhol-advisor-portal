/**
 * Alert evaluation — checks each rule against the current asset state and
 * decorates the row with a `triggered` flag. Demo-grade: evaluation runs at
 * read time so there's no separate cron. Production would persist
 * lastTriggeredAt and only re-fire on a fresh crossing.
 */

import { prisma } from "@/lib/prisma";
import { ASSETS_BY_SYMBOL } from "./data";

export type AlertMetric =
  | "priceDailyChangePct"
  | "ytdReturn"
  | "dividendYield"
  | "peRatio"
  | "lastPrice";

export type AlertOp = "lte" | "gte";

export type AlertWithStatus = {
  id: string;
  symbol: string;
  symbolNameEn: string | null;
  symbolNameAr: string | null;
  metric: AlertMetric;
  op: AlertOp;
  threshold: number;
  active: boolean;
  currentValue: number | null;
  triggered: boolean;
  createdAt: string;
};

function valueFor(symbol: string, metric: AlertMetric): number | null {
  const a = ASSETS_BY_SYMBOL.get(symbol);
  if (!a) return null;
  switch (metric) {
    case "lastPrice":
      return a.lastPrice;
    case "priceDailyChangePct":
      return a.priceChangePct;
    case "ytdReturn":
      return a.ytdReturn;
    case "dividendYield":
      return a.dividendYield ?? null;
    case "peRatio":
      return a.peRatio ?? null;
  }
}

function evaluate(
  value: number | null,
  op: AlertOp,
  threshold: number,
): boolean {
  if (value === null) return false;
  return op === "lte" ? value <= threshold : value >= threshold;
}

export async function getAlertsForAdvisor(
  advisorId: string,
): Promise<AlertWithStatus[]> {
  const rows = await prisma.assetAlert.findMany({
    where: { advisorId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => {
    const asset = ASSETS_BY_SYMBOL.get(r.symbol);
    const value = valueFor(r.symbol, r.metric as AlertMetric);
    const triggered =
      r.active && evaluate(value, r.op as AlertOp, r.threshold);
    return {
      id: r.id,
      symbol: r.symbol,
      symbolNameEn: asset?.nameEn ?? null,
      symbolNameAr: asset?.nameAr ?? null,
      metric: r.metric as AlertMetric,
      op: r.op as AlertOp,
      threshold: r.threshold,
      active: r.active,
      currentValue: value,
      triggered,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

/**
 * Format metric value for display (price = $, others = %, P/E = ×). Used by
 * both the manage panel and the dashboard banner.
 */
export function fmtAlertValue(metric: AlertMetric, value: number): string {
  switch (metric) {
    case "lastPrice":
      return `$${value.toFixed(2)}`;
    case "peRatio":
      return `${value.toFixed(1)}×`;
    case "priceDailyChangePct":
    case "ytdReturn":
    case "dividendYield":
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  }
}
