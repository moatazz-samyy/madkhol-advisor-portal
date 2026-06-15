"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, LineChart } from "lucide-react";
import indicesData from "@/lib/monitor/indices.json";

export function IndicesWidget() {
  const t = useTranslations("monitor");
  const items = indicesData.items;

  return (
    <WidgetCard
      title={t("widget_indices")}
      icon={<LineChart className="w-4 h-4" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((i) => {
          const positive = i.change >= 0;
          const Trend = positive ? TrendingUp : TrendingDown;
          return (
            <div
              key={i.symbol}
              className="rounded-xl border border-border p-3 bg-white"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                {i.name}
              </p>
              <p className="text-lg font-semibold tabular mt-1">
                {i.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p
                className={cn(
                  "text-xs font-medium inline-flex items-center gap-1 tabular mt-0.5",
                  positive ? "text-madkhol-700" : "text-red-600",
                )}
              >
                <Trend className="w-3 h-3" />
                {positive ? "+" : ""}
                {i.change.toFixed(2)}
                <span className="opacity-70">
                  ({positive ? "+" : ""}
                  {i.changePct.toFixed(2)}%)
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

// Re-export the wrapper so other widgets in this folder can share it.
export function WidgetCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 h-full flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-semibold inline-flex items-center gap-2">
          {icon ? (
            <span className="w-7 h-7 rounded-lg bg-madkhol-50 text-madkhol-700 grid place-items-center">
              {icon}
            </span>
          ) : null}
          {title}
        </h3>
        {action}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
