"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { WIDGET_REGISTRY, type WidgetKey } from "@/lib/monitor/registry";
import { CustomizeMonitorPanel } from "./CustomizeMonitorPanel";
import { IndicesWidget } from "./IndicesWidget";
import { MostActiveWidget } from "./MostActiveWidget";
import { GainersLosersWidget } from "./GainersLosersWidget";
import { SectorMiniWidget } from "./SectorMiniWidget";
import { YieldCurveWidget } from "./YieldCurveWidget";
import { EconomicCalendarWidget } from "./EconomicCalendarWidget";
import { CommoditiesWidget } from "./CommoditiesWidget";
import { WatchlistBoardWidget } from "./WatchlistBoardWidget";
import type { SectorSummary } from "@/lib/sectors/types";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";
import type { Asset } from "@/lib/universal-search/types";

export function MonitorPage({
  locale,
  initialWidgets,
  sectors,
  watchlists,
  assets,
}: {
  locale: string;
  initialWidgets: WidgetKey[];
  sectors: SectorSummary[];
  watchlists: WatchlistSummary[];
  assets: Asset[];
}) {
  const t = useTranslations("monitor");
  const router = useRouter();
  const [widgets, setWidgets] = useState<WidgetKey[]>(initialWidgets);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  function renderWidget(key: WidgetKey) {
    switch (key) {
      case "indices":
        return <IndicesWidget />;
      case "mostActive":
        return <MostActiveWidget />;
      case "gainersLosers":
        return <GainersLosersWidget />;
      case "economicCalendar":
        return <EconomicCalendarWidget locale={locale} />;
      case "sectorMini":
        return <SectorMiniWidget locale={locale} summaries={sectors} />;
      case "yieldCurve":
        return <YieldCurveWidget />;
      case "commodities":
        return <CommoditiesWidget locale={locale} />;
      case "watchlistBoard":
        return (
          <WatchlistBoardWidget
            locale={locale}
            watchlists={watchlists}
            assets={assets}
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-outline">
            <RefreshCw
              className={cn("w-4 h-4", refreshing && "animate-spin")}
            />
            {t("refresh")}
          </button>
          <button
            onClick={() => setCustomizeOpen(true)}
            className="btn-gradient"
          >
            <Settings2 className="w-4 h-4" />
            {t("customize")}
          </button>
        </div>
      </header>

      {widgets.length === 0 ? (
        <div className="card p-12 text-center">
          <Settings2 className="w-7 h-7 text-ash-300 mx-auto mb-2" />
          <p className="text-sm text-muted">{t("emptyAllOff")}</p>
          <button
            onClick={() => setCustomizeOpen(true)}
            className="btn-gradient mt-4"
          >
            {t("customize")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">
          {widgets.map((key) => {
            const meta = WIDGET_REGISTRY[key];
            const spanClass =
              meta.colSpan === 12
                ? "lg:col-span-12"
                : meta.colSpan === 6
                  ? "lg:col-span-6"
                  : "lg:col-span-4";
            return (
              <div key={key} className={cn("col-span-1", spanClass)}>
                {renderWidget(key)}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted text-center">
        {t("demoDataDisclaimer")}
      </p>

      {customizeOpen ? (
        <CustomizeMonitorPanel
          active={widgets}
          onChange={setWidgets}
          onClose={() => setCustomizeOpen(false)}
        />
      ) : null}
    </div>
  );
}
