"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { X, BarChart3, Grid3X3, ShieldCheck, ShieldX } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Asset } from "@/lib/universal-search/types";
import {
  correlationMatrix,
  normalizedSeries,
} from "@/lib/universal-search/correlation";

const SERIES_COLORS = ["#0C3D2E", "#2BBE7E", "#D97706", "#1E3A8A"];

type Tab = "overview" | "correlation";

export function CompareView({
  assets,
  locale,
  onClose,
}: {
  assets: Asset[];
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const [tab, setTab] = useState<Tab>("overview");

  const series = useMemo(() => {
    const syms = assets.map((a) => a.symbol);
    return normalizedSeries(syms);
  }, [assets]);

  const corr = useMemo(() => correlationMatrix(assets.map((a) => a.symbol)), [assets]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-5xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t("compareTitle")}</h2>
              <p className="text-xs text-muted">
                {t("compareSubtitle", { n: assets.length })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-border flex gap-1">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
            <BarChart3 className="w-3.5 h-3.5" />
            {t("compareOverview")}
          </TabBtn>
          <TabBtn
            active={tab === "correlation"}
            onClick={() => setTab("correlation")}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            {t("compareCorrelation")}
          </TabBtn>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {tab === "overview" ? (
            <OverviewTab assets={assets} series={series} locale={locale} t={t} />
          ) : (
            <CorrelationTab assets={assets} corr={corr} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────

function OverviewTab({
  assets,
  series,
  locale,
  t,
}: {
  assets: Asset[];
  series: { month: number; values: Record<string, number | null> }[];
  locale: string;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  const chartData = series.map((row) => {
    const obj: Record<string, number | string | null> = { month: row.month };
    for (const sym of Object.keys(row.values)) obj[sym] = row.values[sym];
    return obj;
  });

  return (
    <>
      {/* Header strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {assets.map((a, i) => (
          <div
            key={a.symbol}
            className="card p-3 border-s-4"
            style={{ borderInlineStartColor: SERIES_COLORS[i] }}
          >
            <p className="font-mono font-semibold text-sm">{a.symbol}</p>
            <p className="text-xs text-muted truncate">
              {locale === "ar" ? a.nameAr : a.nameEn}
            </p>
            <p className="text-sm font-semibold tabular mt-1">
              ${a.lastPrice.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Normalized price overlay */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-2">
          {t("compareNormalized")}
        </p>
        <div className="card p-4 h-[280px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={250}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EEF2F0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#8A968F"
                fontSize={11}
                tickFormatter={(m) => `M${m}`}
              />
              <YAxis stroke="#8A968F" fontSize={11} width={50} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E7ECE9",
                  fontSize: 12,
                }}
                formatter={(v) => `${Number(v).toFixed(1)}`}
                labelFormatter={(m) => `${t("compareMonthLabel")} ${m}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {assets.map((a, i) => (
                <Line
                  key={a.symbol}
                  type="monotone"
                  dataKey={a.symbol}
                  stroke={SERIES_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metric table */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-2">
          {t("compareMetrics")}
        </p>
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th className="text-start">{t("compareMetric")}</th>
                {assets.map((a, i) => (
                  <th key={a.symbol} className="text-end">
                    <span
                      className="font-mono text-xs"
                      style={{ color: SERIES_COLORS[i] }}
                    >
                      {a.symbol}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <MetricRow label={t("colPrice")} get={(a) => `$${a.lastPrice.toFixed(2)}`} assets={assets} />
              <MetricRow label={t("colYtd")} tone get={(a) => `${a.ytdReturn.toFixed(1)}%`} numeric={(a) => a.ytdReturn} assets={assets} />
              <MetricRow label={t("col1Y")} tone get={(a) => a.return1Y !== undefined ? `${a.return1Y.toFixed(1)}%` : "—"} numeric={(a) => a.return1Y} assets={assets} />
              <MetricRow label={t("col3Y")} tone get={(a) => a.return3Y !== undefined ? `${a.return3Y.toFixed(1)}%` : "—"} numeric={(a) => a.return3Y} assets={assets} />
              <MetricRow label={t("colVol")} get={(a) => a.volatility1Y !== undefined ? `${a.volatility1Y.toFixed(1)}%` : "—"} assets={assets} />
              <MetricRow label={t("colPE")} get={(a) => a.peRatio !== undefined && a.peRatio > 0 ? `${a.peRatio.toFixed(1)}×` : "—"} assets={assets} />
              <MetricRow label={t("colDividend")} get={(a) => a.dividendYield !== undefined ? `${a.dividendYield.toFixed(2)}%` : "—"} assets={assets} />
              <MetricRow label={t("colMarketCap")} get={(a) => `$${a.marketCapUsd >= 1000 ? (a.marketCapUsd/1000).toFixed(2) + "T" : a.marketCapUsd.toFixed(1) + "B"}`} assets={assets} />
              <tr>
                <td className="text-start font-medium text-muted text-xs uppercase tracking-wider">
                  {t("colShariah")}
                </td>
                {assets.map((a) => (
                  <td key={a.symbol} className="text-end">
                    {a.shariahCompliant ? (
                      <span className="badge-success">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="badge-danger">
                        <ShieldX className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MetricRow({
  label,
  get,
  numeric,
  tone,
  assets,
}: {
  label: string;
  get: (a: Asset) => string;
  numeric?: (a: Asset) => number | undefined;
  tone?: boolean;
  assets: Asset[];
}) {
  return (
    <tr>
      <td className="text-start font-medium text-muted text-xs uppercase tracking-wider">
        {label}
      </td>
      {assets.map((a) => {
        const v = numeric?.(a);
        const colored =
          tone && v !== undefined
            ? v >= 0
              ? "text-madkhol-700"
              : "text-red-600"
            : "text-deep";
        return (
          <td
            key={a.symbol}
            className={cn("text-end tabular text-sm font-medium", colored)}
          >
            {get(a)}
          </td>
        );
      })}
    </tr>
  );
}

// ─── Correlation ───────────────────────────────────────────────────────────

function CorrelationTab({
  assets,
  corr,
  t,
}: {
  assets: Asset[];
  corr: number[][];
  t: (k: string) => string;
}) {
  function cellColor(v: number): { bg: string; text: string } {
    if (Number.isNaN(v)) return { bg: "#F7F9F8", text: "#8A968F" };
    if (v >= 0.7) return { bg: "#0C3D2E", text: "#FFFFFF" };
    if (v >= 0.4) return { bg: "#2BBE7E", text: "#FFFFFF" };
    if (v >= 0.1) return { bg: "#DCEFD0", text: "#0A2E1F" };
    if (v >= -0.1) return { bg: "#F5F2E8", text: "#3D4843" };
    if (v >= -0.4) return { bg: "#FECACA", text: "#7F1D1D" };
    return { bg: "#DC2626", text: "#FFFFFF" };
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("compareCorrelationHint")}</p>

      <div className="card p-4 overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {assets.map((a) => (
                <th
                  key={a.symbol}
                  className="p-2 text-center font-mono text-xs font-semibold"
                >
                  {a.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((rowA, i) => (
              <tr key={rowA.symbol}>
                <th className="p-2 text-end font-mono text-xs font-semibold pe-3">
                  {rowA.symbol}
                </th>
                {assets.map((_, j) => {
                  const v = corr[i][j];
                  const { bg, text } = cellColor(v);
                  return (
                    <td
                      key={j}
                      style={{ backgroundColor: bg, color: text }}
                      className="p-3 text-center font-medium tabular text-sm min-w-[68px] border border-white"
                    >
                      {Number.isNaN(v) ? "—" : v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-3 flex items-center gap-3 text-xs text-muted">
        <span className="font-semibold uppercase tracking-wider">
          {t("compareCorrelationLegend")}:
        </span>
        <Swatch color="#0C3D2E" label="≥ 0.7" />
        <Swatch color="#2BBE7E" label="0.4 – 0.7" />
        <Swatch color="#DCEFD0" label="0.1 – 0.4" />
        <Swatch color="#F5F2E8" label="−0.1 – 0.1" />
        <Swatch color="#FECACA" label="−0.4 – −0.1" />
        <Swatch color="#DC2626" label="< −0.4" />
      </div>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="w-3 h-3 rounded-sm inline-block"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function TabBtn({
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
        "px-3 py-2 text-sm font-medium relative inline-flex items-center gap-1.5 transition",
        active ? "text-deep" : "text-ash-500 hover:text-deep",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-1 -bottom-px h-0.5 bg-madkhol-600 rounded-full" />
      ) : null}
    </button>
  );
}
