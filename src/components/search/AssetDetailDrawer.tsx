"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import {
  X,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Asset } from "@/lib/universal-search/types";
import { synthesizePriceHistory } from "@/lib/universal-search/search";
import { computePurification, fmtPurification } from "@/lib/universal-search/purification";

export function AssetDetailDrawer({
  asset,
  locale,
  selected,
  onToggle,
  onClose,
}: {
  asset: Asset;
  locale: string;
  selected: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const series = useMemo(() => synthesizePriceHistory(asset, 90), [asset]);
  const Trend = asset.ytdReturn >= 0 ? TrendingUp : TrendingDown;
  const purification = computePurification(asset);

  return (
    <div
      className="fixed inset-0 z-50 grid"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.35)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "card shadow-soft h-full overflow-hidden flex flex-col w-full max-w-2xl ms-auto",
          locale === "ar" ? "rounded-e-none rounded-s-2xl" : "rounded-s-none rounded-e-2xl",
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-lg tabular text-deep">
                {asset.symbol}
              </span>
              {asset.shariahCompliant ? (
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
              <span className="badge-neutral text-[10px]">{t(asset.assetClass)}</span>
              <span className="badge-neutral text-[10px]">{t(asset.sector)}</span>
            </div>
            <h2 className="text-xl font-semibold mt-1">
              {locale === "ar" ? asset.nameAr : asset.nameEn}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Price hero */}
          <div className="px-6 py-5 bg-brand-soft border-b border-border">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted">
                  {t("colPrice")}
                </p>
                <p className="text-4xl font-semibold tabular">
                  ${asset.lastPrice.toFixed(2)}
                  <span className="text-base text-muted font-normal ms-2">
                    {asset.currency}
                  </span>
                </p>
                <p
                  className={cn(
                    "text-sm font-medium tabular mt-1 inline-flex items-center gap-1",
                    asset.priceChangePct >= 0 ? "text-madkhol-700" : "text-red-600",
                  )}
                >
                  {asset.priceChangePct >= 0 ? "+" : ""}
                  {asset.priceChangePct.toFixed(2)}% today
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted">
                  {t("colYtd")}
                </p>
                <p
                  className={cn(
                    "text-3xl font-semibold tabular inline-flex items-center gap-2",
                    asset.ytdReturn >= 0 ? "text-madkhol-700" : "text-red-600",
                  )}
                >
                  <Trend className="w-5 h-5" />
                  {asset.ytdReturn >= 0 ? "+" : ""}
                  {asset.ytdReturn.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-[10px] text-ash-400 mt-2">{t("delayedNote")}</p>
          </div>

          {/* Chart */}
          <section className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold mb-3">{t("drawerChartTitle")}</h3>
            <div className="h-[240px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`fill-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2BBE7E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2BBE7E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEF2F0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#8A968F"
                    fontSize={11}
                    tickFormatter={(d) => `${d}d`}
                    reversed={locale === "ar"}
                  />
                  <YAxis
                    stroke="#8A968F"
                    fontSize={11}
                    orientation={locale === "ar" ? "right" : "left"}
                    width={60}
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E7ECE9", fontSize: 12 }}
                    formatter={(v) => `$${Number(v).toFixed(2)}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#2BBE7E"
                    strokeWidth={2.5}
                    fill={`url(#fill-${asset.symbol})`}
                  />
                  <Line type="monotone" dataKey="price" stroke="#2BBE7E" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Fundamentals */}
          <section className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold mb-3">{t("drawerFundamentals")}</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Fact label={t("fundMarketCap")}>
                ${formatCap(asset.marketCapUsd)}B
              </Fact>
              {asset.peRatio !== undefined ? (
                <Fact label={t("fundPE")}>
                  {asset.peRatio > 0 ? asset.peRatio.toFixed(1) : "—"}
                </Fact>
              ) : null}
              {asset.dividendYield !== undefined ? (
                <Fact label={t("fundDividend")}>
                  {asset.dividendYield.toFixed(2)}%
                </Fact>
              ) : null}
              <Fact label={t("fund52w")}>
                ${asset.low52.toFixed(0)} – ${asset.high52.toFixed(0)}
              </Fact>
              {purification.applicable ? (
                <Fact label={t("fundPurification")}>
                  {fmtPurification(purification.perShareUsd, asset.lastPrice)}
                  <span className="text-xs text-muted ms-1">
                    · {purification.ratePct.toFixed(3)}%
                  </span>
                </Fact>
              ) : null}
              <Fact label={t("fundMinOrder")}>
                {t("oneShare")}
                <span className="text-xs text-muted ms-1">
                  · ${asset.lastPrice.toFixed(2)}
                </span>
              </Fact>
            </dl>
          </section>

          {/* Shariah reasoning */}
          <section className="px-6 py-5">
            <h3 className="font-semibold mb-3">{t("drawerShariah")}</h3>
            {asset.shariahCompliant ? (
              <div className="card p-4 bg-madkhol-50 border-madkhol-200 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-madkhol-700 shrink-0 mt-0.5" />
                <p className="text-sm text-deep">
                  {locale === "ar"
                    ? "هذا الأصل ضمن قائمة المتوافقة شرعياً المعتمدة، ويتجاوز عتبات الفحص للديون والربا والإيرادات غير المباحة."
                    : "This asset passes the standard Shariah screens for debt, interest income, and non-permissible revenue ratios."}
                </p>
              </div>
            ) : (
              <div className="card p-4 bg-amber-50 border-amber-200">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
                  {t("shariahReasonTitle")}
                </p>
                <p className="text-sm text-amber-900">
                  {asset.shariahReason ??
                    (locale === "ar"
                      ? "يخفق هذا الأصل في معايير الفحص الشرعي القياسية."
                      : "This asset fails one or more standard Shariah screens.")}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 border-t border-border bg-white">
          <button onClick={onToggle} className="btn-gradient w-full">
            {selected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                {locale === "ar" ? "إزالة من التحديد" : "Remove from selection"}
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                {locale === "ar" ? "إضافة إلى التحديد" : "Add to selection"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <dt className="text-xs uppercase tracking-wider font-semibold text-muted">
        {label}
      </dt>
      <dd className="text-base font-semibold tabular mt-1">{children}</dd>
    </div>
  );
}

function formatCap(usdB: number): string {
  if (usdB >= 1000) return `${(usdB / 1000).toFixed(2)}T`;
  if (usdB >= 1) return usdB.toFixed(1);
  return usdB.toFixed(2);
}
