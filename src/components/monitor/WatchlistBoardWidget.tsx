"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Star, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { WidgetCard } from "./IndicesWidget";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";
import type { Asset } from "@/lib/universal-search/types";

export function WatchlistBoardWidget({
  locale,
  watchlists,
  assets,
}: {
  locale: string;
  watchlists: WatchlistSummary[];
  assets: Asset[];
}) {
  const t = useTranslations("monitor");

  // De-dupe assets by symbol — the ASSETS list is the source of truth
  const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));

  const [activeId, setActiveId] = useState<string | null>(
    watchlists[0]?.id ?? null,
  );
  const active = watchlists.find((w) => w.id === activeId);
  const rows = (active?.symbols ?? [])
    .map((s) => assetBySymbol.get(s))
    .filter((a): a is Asset => a !== undefined);

  if (watchlists.length === 0) {
    return (
      <WidgetCard
        title={t("widget_watchlistBoard")}
        icon={<Star className="w-4 h-4 fill-current" />}
      >
        <div className="text-center py-8 text-sm text-muted">
          <p>{t("watchlistsEmpty")}</p>
          <Link
            href={`/${locale}/search`}
            className="btn-outline text-xs mt-3 inline-flex"
          >
            {t("watchlistsCreate")}
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={t("widget_watchlistBoard")}
      icon={<Star className="w-4 h-4 fill-current" />}
      action={
        <Link
          href={`/${locale}/search`}
          className="text-xs text-madkhol-700 inline-flex items-center gap-1 hover:underline"
        >
          {t("openSearch")}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {watchlists.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveId(w.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition",
              activeId === w.id
                ? "bg-deep border-deep text-white"
                : "bg-white border-border text-ash-600 hover:border-madkhol-300 hover:text-deep",
            )}
          >
            {locale === "ar" && w.nameAr ? w.nameAr : w.name}
            <span className="ms-1 opacity-70">{w.itemCount}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-sm text-muted py-6">
          {t("watchlistEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="text-start pb-2 font-semibold">{t("colSymbol")}</th>
                <th className="text-end pb-2 font-semibold">{t("colPrice")}</th>
                <th className="text-end pb-2 font-semibold">{t("colChange")}</th>
                <th className="text-end pb-2 font-semibold">{t("colYtd")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const positive = a.priceChangePct >= 0;
                const Trend = positive ? TrendingUp : TrendingDown;
                const ytdPositive = a.ytdReturn >= 0;
                return (
                  <tr key={a.symbol} className="border-t border-border/60">
                    <td className="py-2">
                      <p className="font-mono font-semibold text-deep">
                        {a.symbol}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {locale === "ar" ? a.nameAr : a.nameEn}
                      </p>
                    </td>
                    <td className="py-2 text-end tabular font-medium">
                      ${a.lastPrice.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "py-2 text-end tabular font-medium",
                        positive ? "text-madkhol-700" : "text-red-600",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trend className="w-3 h-3" />
                        {positive ? "+" : ""}
                        {a.priceChangePct.toFixed(2)}%
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-2 text-end tabular font-medium",
                        ytdPositive ? "text-madkhol-700" : "text-red-600",
                      )}
                    >
                      {ytdPositive ? "+" : ""}
                      {a.ytdReturn.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </WidgetCard>
  );
}
