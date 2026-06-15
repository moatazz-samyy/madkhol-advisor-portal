"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Zap, Wifi, Info, Settings2, Star, Bell } from "lucide-react";
import { FilterSidebar } from "./FilterSidebar";
import { ResultsList } from "./ResultsList";
import { AssetDetailDrawer } from "./AssetDetailDrawer";
import { SelectionBar } from "./SelectionBar";
import { AddToPicker } from "./AddToPicker";
import { CustomizePanel } from "./CustomizePanel";
import { WatchlistsPanel } from "./WatchlistsPanel";
import { CompareView } from "./CompareView";
import { AlertsPanel } from "./AlertsPanel";
import { searchAssets } from "@/lib/universal-search/search";
import {
  DEFAULT_FILTERS,
  type Asset,
  type ColumnKey,
  type RangeFilters,
  type SearchFilters,
} from "@/lib/universal-search/types";
import type { SearchPreferences } from "@/lib/universal-search/preferences";
import type { SymbolPositionSummary } from "@/lib/universal-search/positions";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";
import type { AssetNoteSummary } from "@/lib/universal-search/notes";
import type { AlertWithStatus } from "@/lib/universal-search/alerts";
import { cn } from "@/lib/cn";

type Model = { id: string; name: string; nameAr: string; holdingsCount: number };
type Client = { id: string; name: string; nameAr: string; aumSar: number };

export function UniversalSearch({
  locale,
  assets,
  models,
  clients,
  liveDataEnabled,
  initialPreferences,
  positions,
  watchlists,
  notes,
  alerts,
}: {
  locale: string;
  assets: Asset[];
  models: Model[];
  clients: Client[];
  liveDataEnabled: boolean;
  initialPreferences: SearchPreferences;
  positions: Record<string, SymbolPositionSummary>;
  watchlists: WatchlistSummary[];
  notes: Record<string, AssetNoteSummary>;
  alerts: AlertWithStatus[];
}) {
  const t = useTranslations("search");
  const router = useRouter();

  // Debounced search query so autosuggest feels live without thrashing
  const [rawQ, setRawQ] = useState("");
  // Seed the filters' ranges from the saved preferences so the Customize panel
  // and the result list start in sync.
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ranges: initialPreferences.ranges,
  });
  const [columns, setColumns] = useState<ColumnKey[]>(initialPreferences.columns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Asset | null>(null);
  const [picker, setPicker] = useState<"model" | "client" | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [watchlistsOpen, setWatchlistsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const triggeredAlertCount = useMemo(
    () => alerts.filter((a) => a.triggered).length,
    [alerts],
  );

  // Reverse-index: symbol → watchlistIds it belongs to. Powers the star toggle
  // popover state and the "Filter by watchlist" filter sidebar group.
  const membershipBySymbol = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const w of watchlists) {
      for (const s of w.symbols) {
        const arr = m.get(s) ?? [];
        arr.push(w.id);
        m.set(s, arr);
      }
    }
    return m;
  }, [watchlists]);

  // Union of symbols across selected watchlists (passed to searchAssets when
  // filters.watchlistIds is non-empty).
  const watchlistSymbolUnion = useMemo(() => {
    if (filters.watchlistIds.length === 0) return undefined;
    const set = new Set<string>();
    for (const w of watchlists) {
      if (filters.watchlistIds.includes(w.id)) {
        for (const s of w.symbols) set.add(s);
      }
    }
    return set;
  }, [filters.watchlistIds, watchlists]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((f) => ({ ...f, q: rawQ }));
    }, 180);
    return () => clearTimeout(handle);
  }, [rawQ]);

  const results = useMemo(() => {
    // Filter against the static dataset; pure JS so it's <1ms
    void assets; // pinned through props for future server-side variant
    return searchAssets(filters, watchlistSymbolUnion);
  }, [filters, assets, watchlistSymbolUnion]);

  function toggleSelected(symbol: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full",
            liveDataEnabled
              ? "bg-madkhol-50 text-madkhol-700"
              : "bg-ash-100 text-ash-600",
          )}
        >
          {liveDataEnabled ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              {t("live")}
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              {t("demo")}
            </>
          )}
        </span>
      </header>

      {/* Min-share rule banner — shown once, applies to every buy/sell flow */}
      <div className="card p-3 bg-madkhol-50/40 border-madkhol-100 flex items-center gap-3">
        <Info className="w-4 h-4 text-madkhol-700 shrink-0" />
        <p className="text-sm font-medium text-deep">{t("minShareRuleTitle")}</p>
      </div>

      {/* Search bar */}
      <div className="card p-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
          <input
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
            placeholder={t("placeholder")}
            className="input ps-10 py-3 text-base border-0 focus:ring-0 focus:border-0 bg-transparent"
            autoFocus
          />
        </div>
        <button
          onClick={() => setAlertsOpen(true)}
          className="btn-outline shrink-0 relative"
        >
          <Bell className="w-4 h-4" />
          {t("alerts")}
          {triggeredAlertCount > 0 ? (
            <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold grid place-items-center">
              {triggeredAlertCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setWatchlistsOpen(true)}
          className="btn-outline shrink-0"
        >
          <Star className="w-4 h-4" />
          {t("watchlists")}
        </button>
        <button
          onClick={() => setCustomizeOpen(true)}
          className="btn-outline shrink-0"
        >
          <Settings2 className="w-4 h-4" />
          {t("customize")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          totalCount={results.length}
          watchlists={watchlists}
          locale={locale}
        />
        <ResultsList
          results={results}
          locale={locale}
          selected={selected}
          onToggle={toggleSelected}
          onOpen={(a) => setActive(a)}
          columns={columns}
          positions={positions}
          watchlists={watchlists}
          membershipBySymbol={membershipBySymbol}
          notes={notes}
        />
      </div>

      {active ? (
        <AssetDetailDrawer
          asset={active}
          locale={locale}
          selected={selected.has(active.symbol)}
          onToggle={() => {
            toggleSelected(active.symbol);
          }}
          onClose={() => setActive(null)}
        />
      ) : null}

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onAddToModel={() => setPicker("model")}
        onAddToClient={() => setPicker("client")}
        onCompare={selected.size >= 2 && selected.size <= 4 ? () => setCompareOpen(true) : undefined}
        onOptimize={() => {
          const symbolList = Array.from(selected).join(",");
          router.push(
            `/${locale}/optimizer?source=search&symbols=${encodeURIComponent(symbolList)}`,
          );
        }}
      />

      {picker ? (
        <AddToPicker
          mode={picker}
          models={models}
          clients={clients}
          symbols={Array.from(selected)}
          locale={locale}
          onClose={() => setPicker(null)}
          onDone={() => {
            setPicker(null);
            setSelected(new Set());
          }}
        />
      ) : null}

      {customizeOpen ? (
        <CustomizePanel
          columns={columns}
          ranges={filters.ranges}
          onChange={(next: { columns: ColumnKey[]; ranges: RangeFilters }) => {
            setColumns(next.columns);
            setFilters((f) => ({ ...f, ranges: next.ranges }));
          }}
          onClose={() => setCustomizeOpen(false)}
        />
      ) : null}

      {watchlistsOpen ? (
        <WatchlistsPanel
          watchlists={watchlists}
          locale={locale}
          onClose={() => setWatchlistsOpen(false)}
        />
      ) : null}

      {compareOpen ? (
        <CompareView
          assets={results.filter((a) => selected.has(a.symbol)).slice(0, 4)}
          locale={locale}
          onClose={() => setCompareOpen(false)}
        />
      ) : null}

      {alertsOpen ? (
        <AlertsPanel
          alerts={alerts}
          symbols={assets.map((a) => ({
            symbol: a.symbol,
            nameEn: a.nameEn,
            nameAr: a.nameAr,
          }))}
          locale={locale}
          onClose={() => setAlertsOpen(false)}
        />
      ) : null}
    </div>
  );
}
