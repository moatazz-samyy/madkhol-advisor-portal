"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import type { SectorSummary } from "@/lib/sectors/types";

export function SectorMiniWidget({
  locale,
  summaries,
}: {
  locale: string;
  summaries: SectorSummary[];
}) {
  const t = useTranslations("monitor");

  return (
    <WidgetCard
      title={t("widget_sectorMini")}
      icon={<LayoutGrid className="w-4 h-4" />}
      action={
        <Link
          href={`/${locale}/sectors`}
          className="text-xs text-madkhol-700 inline-flex items-center gap-1 hover:underline"
        >
          {t("openFull")}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      }
    >
      <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
        {summaries.map((s) => {
          const positive = s.todayChangePct >= 0;
          const intensity = Math.min(1, Math.abs(s.todayChangePct) / 2.5);
          return (
            <Link
              key={s.key}
              href={`/${locale}/sectors/${s.key}`}
              className="rounded-md p-2 hover:brightness-95 transition border border-border/40"
              style={{
                backgroundImage: positive
                  ? `linear-gradient(135deg, rgba(43,190,126,${0.08 + intensity * 0.3}) 0%, rgba(107,224,127,${0.04 + intensity * 0.2}) 100%)`
                  : `linear-gradient(135deg, rgba(220,38,38,${0.08 + intensity * 0.25}) 0%, rgba(252,165,165,${0.04 + intensity * 0.2}) 100%)`,
              }}
            >
              <p className="text-[10px] font-medium text-deep truncate">
                {locale === "ar" ? s.labelAr : s.labelEn}
              </p>
              <p
                className={cn(
                  "text-xs font-semibold tabular mt-0.5",
                  positive ? "text-madkhol-700" : "text-red-600",
                )}
              >
                {positive ? "+" : ""}
                {s.todayChangePct.toFixed(2)}%
              </p>
            </Link>
          );
        })}
      </div>
    </WidgetCard>
  );
}
