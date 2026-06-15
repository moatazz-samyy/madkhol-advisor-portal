"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { CalendarDays } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import cal from "@/lib/monitor/economic-calendar.json";

const IMPACT_TONE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-ash-100 text-ash-600",
};

export function EconomicCalendarWidget({ locale }: { locale: string }) {
  const t = useTranslations("monitor");
  const items = cal.items;

  return (
    <WidgetCard
      title={t("widget_economicCalendar")}
      icon={<CalendarDays className="w-4 h-4" />}
    >
      <div className="overflow-y-auto max-h-[360px] pe-1">
        <ul className="space-y-2">
          {items.map((e, i) => (
            <li
              key={i}
              className="rounded-lg border border-border p-3 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted tabular">
                    {e.date} · {e.time}
                  </p>
                  <p className="text-sm font-medium mt-0.5 leading-tight">
                    {locale === "ar" ? e.eventAr : e.event}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                    IMPACT_TONE[e.impact],
                  )}
                >
                  {t(`impact_${e.impact}`)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className="text-muted">
                  {t("consensus")}:{" "}
                  <span className="font-medium text-deep tabular">
                    {e.consensus}
                  </span>
                </span>
                <span className="text-muted">
                  {t("prior")}:{" "}
                  <span className="font-medium text-deep tabular">
                    {e.prior}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}
