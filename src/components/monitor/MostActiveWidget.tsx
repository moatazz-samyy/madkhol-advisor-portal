"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Activity } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import mostActive from "@/lib/monitor/most-active.json";

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function MostActiveWidget() {
  const t = useTranslations("monitor");

  return (
    <WidgetCard
      title={t("widget_mostActive")}
      icon={<Activity className="w-4 h-4" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted">
              <th className="text-start pb-2 font-semibold">{t("colSymbol")}</th>
              <th className="text-end pb-2 font-semibold">{t("colPrice")}</th>
              <th className="text-end pb-2 font-semibold">{t("colChange")}</th>
              <th className="text-end pb-2 font-semibold">{t("colVolume")}</th>
            </tr>
          </thead>
          <tbody>
            {mostActive.items.map((s) => {
              const positive = s.changePct >= 0;
              return (
                <tr key={s.symbol} className="border-t border-border/60">
                  <td className="py-2">
                    <p className="font-mono font-semibold text-deep text-sm">
                      {s.symbol}
                    </p>
                    <p className="text-[11px] text-muted truncate">{s.name}</p>
                  </td>
                  <td className="py-2 text-end tabular font-medium">
                    ${s.price.toFixed(2)}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-end tabular font-medium",
                      positive ? "text-madkhol-700" : "text-red-600",
                    )}
                  >
                    {positive ? "+" : ""}
                    {s.changePct.toFixed(2)}%
                  </td>
                  <td className="py-2 text-end tabular text-xs text-muted">
                    {fmtVolume(s.volumeShares)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WidgetCard>
  );
}
