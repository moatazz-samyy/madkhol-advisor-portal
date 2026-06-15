"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  ShieldCheck,
  ShieldX,
  TrendingUp,
  TrendingDown,
  Search as SearchIcon,
  Droplet,
  Users,
  CalendarClock,
} from "lucide-react";
import type { Asset, ColumnKey } from "@/lib/universal-search/types";
import { DEFAULT_COLUMNS } from "@/lib/universal-search/types";
import {
  computePurification,
  fmtPurification,
} from "@/lib/universal-search/purification";
import type { SymbolPositionSummary } from "@/lib/universal-search/positions";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";
import type { AssetNoteSummary } from "@/lib/universal-search/notes";
import { earningsFor, daysUntilEarnings } from "@/lib/universal-search/earnings";
import { StarToggle } from "./StarToggle";
import { NoteButton } from "./NoteButton";

export function ResultsList({
  results,
  locale,
  selected,
  onToggle,
  onOpen,
  columns,
  positions,
  watchlists,
  membershipBySymbol,
  notes,
}: {
  results: Asset[];
  locale: string;
  selected: Set<string>;
  onToggle: (symbol: string) => void;
  onOpen: (asset: Asset) => void;
  columns?: ColumnKey[];
  positions?: Record<string, SymbolPositionSummary>;
  watchlists?: WatchlistSummary[];
  membershipBySymbol?: Map<string, string[]>;
  notes?: Record<string, AssetNoteSummary>;
}) {
  const t = useTranslations("search");
  const cols = columns ?? DEFAULT_COLUMNS;

  if (results.length === 0) {
    return (
      <div className="card p-14 text-center">
        <SearchIcon className="w-7 h-7 text-ash-300 mx-auto mb-2" />
        <p className="text-sm text-muted">{t("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10"></th>
              {watchlists ? <th className="w-16"></th> : null}
              <th>{t("colSymbol")}</th>
              <th>{t("colName")}</th>
              <th>{t("colAssetClass")}</th>
              <th>{t("colSector")}</th>
              <th className="text-end">{t("colPrice")}</th>
              {cols.map((col) => (
                <DynamicHeader key={col} col={col} t={t} />
              ))}
              <th>{t("colShariah")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((a) => {
              const isSelected = selected.has(a.symbol);
              return (
                <tr
                  key={a.symbol}
                  className={cn(
                    "cursor-pointer transition",
                    isSelected && "bg-madkhol-50/40",
                  )}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(a.symbol)}
                      className="w-4 h-4 accent-madkhol-600"
                      aria-label={`Select ${a.symbol}`}
                    />
                  </td>
                  {watchlists ? (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-0.5">
                        <StarToggle
                          symbol={a.symbol}
                          watchlists={watchlists}
                          membership={membershipBySymbol?.get(a.symbol) ?? []}
                          locale={locale}
                        />
                        {notes ? (
                          <NoteButton
                            symbol={a.symbol}
                            initialBody={notes[a.symbol]?.body}
                            initialUpdatedAt={notes[a.symbol]?.updatedAt}
                          />
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  <td onClick={() => onOpen(a)}>
                    <span className="font-mono font-semibold text-deep">
                      {a.symbol}
                    </span>
                  </td>
                  <td onClick={() => onOpen(a)}>
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {locale === "ar" ? a.nameAr : a.nameEn}
                      </p>
                      <p className="text-xs text-muted">
                        ${a.lastPrice.toFixed(2)} {a.currency}
                      </p>
                    </div>
                  </td>
                  <td onClick={() => onOpen(a)}>
                    <span className="badge-neutral text-[10px]">
                      {t(a.assetClass)}
                    </span>
                  </td>
                  <td onClick={() => onOpen(a)} className="text-sm text-muted">
                    {t(a.sector)}
                  </td>
                  <td
                    onClick={() => onOpen(a)}
                    className="text-end tabular text-sm"
                  >
                    <p className="font-medium">${a.lastPrice.toFixed(2)}</p>
                    <p
                      className={cn(
                        "text-[10px]",
                        a.priceChangePct >= 0
                          ? "text-madkhol-700"
                          : "text-red-600",
                      )}
                    >
                      {a.priceChangePct >= 0 ? "+" : ""}
                      {a.priceChangePct.toFixed(2)}%
                    </p>
                  </td>
                  {cols.map((col) => (
                    <DynamicCell
                      key={col}
                      col={col}
                      a={a}
                      onOpen={onOpen}
                      t={t}
                      locale={locale}
                      position={positions?.[a.symbol]}
                    />
                  ))}
                  <td onClick={() => onOpen(a)}>
                    {a.shariahCompliant ? (
                      <span className="badge-success">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t("shariahCompliantBadge")}
                      </span>
                    ) : (
                      <span className="badge-danger">
                        <ShieldX className="w-3.5 h-3.5" />
                        {t("shariahNonCompliantBadge")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Per-column header + cell renderers ────────────────────────────────────

function DynamicHeader({
  col,
  t,
}: {
  col: ColumnKey;
  t: (k: string) => string;
}) {
  switch (col) {
    case "ytd":
      return <th className="text-end">{t("colYtd")}</th>;
    case "return1Y":
      return <th className="text-end">{t("col1Y")}</th>;
    case "return3Y":
      return <th className="text-end">{t("col3Y")}</th>;
    case "volatility1Y":
      return <th className="text-end">{t("colVol")}</th>;
    case "peRatio":
      return <th className="text-end">{t("colPE")}</th>;
    case "dividendYield":
      return <th className="text-end">{t("colDividend")}</th>;
    case "marketCap":
      return <th className="text-end">{t("colMarketCap")}</th>;
    case "heldByClients":
      return (
        <th className="text-end" title={t("colHeldByTooltip")}>
          {t("colHeldBy")}
        </th>
      );
    case "nextEarnings":
      return <th className="text-end">{t("colNextEarnings")}</th>;
    case "purification":
      return (
        <th className="text-end" title={t("colPurificationTooltip")}>
          {t("colPurification")}
        </th>
      );
  }
}

function DynamicCell({
  col,
  a,
  onOpen,
  t,
  locale,
  position,
}: {
  col: ColumnKey;
  a: Asset;
  onOpen: (a: Asset) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
  locale: string;
  position?: SymbolPositionSummary;
}) {
  const td = (children: React.ReactNode, extra?: string) => (
    <td
      onClick={() => onOpen(a)}
      className={cn("text-end tabular text-sm", extra)}
    >
      {children}
    </td>
  );

  switch (col) {
    case "ytd": {
      const Trend = a.ytdReturn >= 0 ? TrendingUp : TrendingDown;
      return td(
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium",
            a.ytdReturn >= 0 ? "text-madkhol-700" : "text-red-600",
          )}
        >
          <Trend className="w-3 h-3" />
          {a.ytdReturn >= 0 ? "+" : ""}
          {a.ytdReturn.toFixed(1)}%
        </span>,
      );
    }
    case "return1Y":
      return td(
        a.return1Y !== undefined ? (
          <span
            className={cn(
              "font-medium",
              a.return1Y >= 0 ? "text-madkhol-700" : "text-red-600",
            )}
          >
            {a.return1Y >= 0 ? "+" : ""}
            {a.return1Y.toFixed(1)}%
          </span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    case "return3Y":
      return td(
        a.return3Y !== undefined ? (
          <span
            className={cn(
              "font-medium",
              a.return3Y >= 0 ? "text-madkhol-700" : "text-red-600",
            )}
          >
            {a.return3Y >= 0 ? "+" : ""}
            {a.return3Y.toFixed(1)}%
          </span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    case "volatility1Y":
      return td(
        a.volatility1Y !== undefined ? (
          <span className="text-deep">{a.volatility1Y.toFixed(1)}%</span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    case "peRatio":
      return td(
        a.peRatio !== undefined && a.peRatio > 0 ? (
          <span className="text-deep">{a.peRatio.toFixed(1)}×</span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    case "dividendYield":
      return td(
        a.dividendYield !== undefined ? (
          <span className="text-deep">{a.dividendYield.toFixed(2)}%</span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    case "marketCap":
      return td(<span className="text-deep">${fmtCap(a.marketCapUsd)}</span>);
    case "heldByClients": {
      if (!position || position.clientCount === 0) {
        return td(<span className="text-ash-400">—</span>);
      }
      const previewNames = position.topClientPreview
        .map((p) => (locale === "ar" ? p.nameAr : p.name))
        .join(", ");
      return td(
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-madkhol-50 text-madkhol-700 text-xs font-medium"
          title={`${previewNames}${position.clientCount > 3 ? ` +${position.clientCount - 3}` : ""}`}
        >
          <Users className="w-3 h-3" />
          {position.clientCount}
        </span>,
      );
    }
    case "nextEarnings": {
      const e = earningsFor(a.symbol);
      const days = daysUntilEarnings(a.symbol);
      if (!e || days === null) {
        return td(<span className="text-ash-400">—</span>);
      }
      const tone =
        days <= 7 ? "text-amber-700" : days <= 30 ? "text-deep" : "text-ash-500";
      return td(
        <span
          className={cn("inline-flex items-center gap-1 text-xs", tone)}
          title={`${e.type} · est. EPS ${e.estEps.toFixed(2)} · ${e.consensusCount} analysts`}
        >
          <CalendarClock className="w-3 h-3" />
          {days <= 0 ? t("earningsToday") : t("earningsInDays", { n: days })}
        </span>,
      );
    }
    case "purification": {
      const pur = computePurification(a);
      return td(
        pur.applicable ? (
          <span
            className="inline-flex items-center gap-1 text-deep"
            title={`${pur.ratePct.toFixed(3)}% ${t("purificationOfPrice")}`}
          >
            <Droplet className="w-3 h-3 text-madkhol-600" />
            {fmtPurification(pur.perShareUsd, a.lastPrice)}
          </span>
        ) : (
          <span className="text-ash-400">—</span>
        ),
      );
    }
  }
}

function fmtCap(usdB: number): string {
  if (usdB >= 1000) return `${(usdB / 1000).toFixed(2)}T`;
  if (usdB >= 1) return `${usdB.toFixed(1)}B`;
  return `${(usdB * 1000).toFixed(0)}M`;
}
