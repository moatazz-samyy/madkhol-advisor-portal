"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ShieldCheck, Star, X } from "lucide-react";
import type {
  AssetClass,
  GicsSector,
  MarketCapBucket,
  Region,
  SearchFilters,
} from "@/lib/universal-search/types";
import { DEFAULT_FILTERS } from "@/lib/universal-search/types";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";

const ASSET_CLASSES: AssetClass[] = ["stock", "etf", "mutual_fund"];

const SECTORS: GicsSector[] = [
  "tech",
  "healthcare",
  "financials",
  "consumer_discretionary",
  "consumer_staples",
  "communication",
  "industrials",
  "energy",
  "materials",
  "utilities",
  "real_estate",
  "diversified",
];

const REGIONS: Region[] = ["us", "europe", "asia", "emerging"];
const CAPS: MarketCapBucket[] = ["mega", "large", "mid", "small"];

export function FilterSidebar({
  filters,
  onChange,
  totalCount,
  watchlists,
  locale,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  totalCount: number;
  watchlists?: WatchlistSummary[];
  locale?: string;
}) {
  const t = useTranslations("search");

  function toggleArray<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  return (
    <aside className="card p-5 space-y-6 sticky top-20 self-start max-h-[calc(100vh-110px)] overflow-y-auto">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">{t("filters")}</h3>
        <button
          onClick={() => onChange({ ...DEFAULT_FILTERS, q: filters.q })}
          className="btn-ghost text-xs"
        >
          <X className="w-3 h-3" />
          {t("clearFilters")}
        </button>
      </header>

      {/* Shariah toggle — prominent */}
      <div className="card p-3 bg-madkhol-50 border-madkhol-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="w-9 h-9 rounded-xl bg-madkhol-100 text-madkhol-700 grid place-items-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <span className="flex-1 text-sm font-medium text-deep">
            {t("shariahOnly")}
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...filters, shariahOnly: !filters.shariahOnly })}
            className={cn(
              "relative w-11 h-6 rounded-full transition shrink-0",
              filters.shariahOnly ? "bg-madkhol-600" : "bg-ash-200",
            )}
            aria-pressed={filters.shariahOnly}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all",
                filters.shariahOnly ? "start-5" : "start-0.5",
              )}
            />
          </button>
        </label>
      </div>

      {watchlists && watchlists.length > 0 ? (
        <FilterGroup
          label={
            <span className="inline-flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              {t("watchlists")}
            </span>
          }
        >
          {watchlists.map((w) => (
            <Pill
              key={w.id}
              active={filters.watchlistIds.includes(w.id)}
              onClick={() =>
                onChange({
                  ...filters,
                  watchlistIds: toggleArray(filters.watchlistIds, w.id),
                })
              }
            >
              {locale === "ar" && w.nameAr ? w.nameAr : w.name}
              <span className="ms-1 text-[10px] opacity-70">
                {w.itemCount}
              </span>
            </Pill>
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup label={t("assetClass")}>
        {ASSET_CLASSES.map((ac) => (
          <Pill
            key={ac}
            active={filters.assetClasses.includes(ac)}
            onClick={() =>
              onChange({ ...filters, assetClasses: toggleArray(filters.assetClasses, ac) })
            }
          >
            {t(ac)}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label={t("sectors")}>
        {SECTORS.map((s) => (
          <Pill
            key={s}
            active={filters.sectors.includes(s)}
            onClick={() => onChange({ ...filters, sectors: toggleArray(filters.sectors, s) })}
          >
            {t(s)}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label={t("regions")}>
        {REGIONS.map((r) => (
          <Pill
            key={r}
            active={filters.regions.includes(r)}
            onClick={() => onChange({ ...filters, regions: toggleArray(filters.regions, r) })}
          >
            {t(`region_${r}`)}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup label={t("marketCap")}>
        {CAPS.map((c) => (
          <Pill
            key={c}
            active={filters.marketCapBuckets.includes(c)}
            onClick={() =>
              onChange({
                ...filters,
                marketCapBuckets: toggleArray(filters.marketCapBuckets, c),
              })
            }
          >
            {t(`cap_${c}`)}
          </Pill>
        ))}
      </FilterGroup>

      <div>
        <label className="label">{t("ytdRange")}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.ytdRange[0]}
            onChange={(e) =>
              onChange({
                ...filters,
                ytdRange: [Number(e.target.value), filters.ytdRange[1]],
              })
            }
            className="input text-end tabular py-1.5"
            dir="ltr"
          />
          <span className="text-ash-400">—</span>
          <input
            type="number"
            value={filters.ytdRange[1]}
            onChange={(e) =>
              onChange({
                ...filters,
                ytdRange: [filters.ytdRange[0], Number(e.target.value)],
              })
            }
            className="input text-end tabular py-1.5"
            dir="ltr"
          />
        </div>
      </div>

      <p className="text-xs text-muted tabular pt-2 border-t border-border">
        {t("resultsCount", { n: totalCount })}
      </p>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium border transition",
        active
          ? "bg-deep border-deep text-white"
          : "bg-white border-border text-ash-600 hover:border-madkhol-300 hover:text-deep",
      )}
    >
      {children}
    </button>
  );
}
