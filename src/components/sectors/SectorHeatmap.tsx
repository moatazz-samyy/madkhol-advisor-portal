"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import type { SectorSummary } from "@/lib/sectors/types";
import { ClientPickerPill } from "./ClientPickerPill";

type Client = { id: string; name: string; nameAr: string; aumSar: number };

export function SectorHeatmap({
  locale,
  summaries,
  clients,
  activeClientIds,
}: {
  locale: string;
  summaries: SectorSummary[];
  clients: Client[];
  activeClientIds: string[];
}) {
  const t = useTranslations("sectors");
  const clientsQuery = activeClientIds.length > 0
    ? `?clients=${activeClientIds.join(",")}`
    : "";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
        </div>
        <ClientPickerPill
          locale={locale}
          clients={clients}
          activeClientIds={activeClientIds}
        />
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {summaries.map((s) => {
          const positive = s.todayChangePct >= 0;
          const intensity = Math.min(1, Math.abs(s.todayChangePct) / 2.5);
          const Trend = positive ? TrendingUp : TrendingDown;
          const baseHref = `/${locale}/sectors/${s.key}`;
          const href = `${baseHref}${clientsQuery}`;

          return (
            <Link
              key={s.key}
              href={href}
              className="group relative card overflow-hidden transition hover:shadow-soft hover:-translate-y-0.5"
              style={{
                backgroundImage: positive
                  ? `linear-gradient(135deg, rgba(43,190,126,${0.05 + intensity * 0.25}) 0%, rgba(107,224,127,${0.02 + intensity * 0.15}) 100%)`
                  : `linear-gradient(135deg, rgba(220,38,38,${0.05 + intensity * 0.22}) 0%, rgba(252,165,165,${0.02 + intensity * 0.18}) 100%)`,
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg leading-tight">
                    {locale === "ar" ? s.labelAr : s.labelEn}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium tabular shrink-0",
                      positive
                        ? "bg-madkhol-700 text-white"
                        : "bg-red-700 text-white",
                    )}
                  >
                    <Trend className="w-3 h-3" />
                    {positive ? "+" : ""}
                    {s.todayChangePct.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted">{t("ytd")}</span>
                  <span
                    className={cn(
                      "tabular font-medium",
                      s.ytdReturnPct >= 0 ? "text-madkhol-700" : "text-red-600",
                    )}
                  >
                    {s.ytdReturnPct >= 0 ? "+" : ""}
                    {s.ytdReturnPct.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-ash-500 tabular">
                    {s.stockCount} {t("stocks")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-madkhol-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="tabular">{s.compliantCount}</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <p className="text-xs text-muted text-center">
        {locale === "ar"
          ? "البيانات تجريبية ومتأخّرة بنحو 15 دقيقة."
          : "Demo data, delayed ~15 min."}
      </p>
    </div>
  );
}
