"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import data from "@/lib/monitor/gainers-losers.json";

type Row = { symbol: string; name: string; price: number; changePct: number };

export function GainersLosersWidget() {
  const t = useTranslations("monitor");

  return (
    <WidgetCard
      title={t("widget_gainersLosers")}
      icon={<ArrowUpDown className="w-4 h-4" />}
    >
      <div className="grid grid-cols-2 gap-4">
        <Column
          title={t("topGainers")}
          tone="up"
          rows={data.gainers}
        />
        <Column
          title={t("topLosers")}
          tone="down"
          rows={data.losers}
        />
      </div>
    </WidgetCard>
  );
}

function Column({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "up" | "down";
  rows: Row[];
}) {
  const Trend = tone === "up" ? TrendingUp : TrendingDown;
  const color = tone === "up" ? "text-madkhol-700" : "text-red-600";
  return (
    <div>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-2",
          color,
        )}
      >
        <Trend className="w-3 h-3" />
        {title}
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.symbol}
            className="flex items-center justify-between text-sm gap-2"
          >
            <div className="min-w-0">
              <p className="font-mono font-semibold text-deep text-sm">
                {r.symbol}
              </p>
              <p className="text-[11px] text-muted truncate">{r.name}</p>
            </div>
            <div className="text-end shrink-0">
              <p className="tabular font-medium">${r.price.toFixed(2)}</p>
              <p className={cn("text-xs tabular font-medium", color)}>
                {r.changePct >= 0 ? "+" : ""}
                {r.changePct.toFixed(2)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
