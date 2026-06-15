"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Droplets } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import data from "@/lib/monitor/commodities.json";

export function CommoditiesWidget({ locale }: { locale: string }) {
  const t = useTranslations("monitor");

  return (
    <WidgetCard
      title={t("widget_commodities")}
      icon={<Droplets className="w-4 h-4" />}
    >
      <ul className="space-y-2">
        {data.items.map((c) => {
          const positive = c.changePct >= 0;
          return (
            <li
              key={c.symbol}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 bg-white"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {locale === "ar" ? c.nameAr : c.name}
                </p>
                {c.unit ? (
                  <p className="text-[10px] text-muted">{c.unit}</p>
                ) : null}
              </div>
              <div className="text-end shrink-0">
                <p className="text-sm font-semibold tabular">
                  {c.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </p>
                <p
                  className={cn(
                    "text-xs tabular font-medium",
                    positive ? "text-madkhol-700" : "text-red-600",
                  )}
                >
                  {positive ? "+" : ""}
                  {c.changePct.toFixed(2)}%
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}
