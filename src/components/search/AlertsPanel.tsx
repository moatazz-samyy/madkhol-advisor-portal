"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  X,
  Bell,
  BellOff,
  Trash2,
  Plus,
  CircleAlert,
  Zap,
} from "lucide-react";
import {
  createAssetAlert,
  deleteAssetAlert,
  toggleAssetAlertActive,
  type AlertMetric,
  type AlertOp,
} from "@/app/[locale]/(app)/search/actions";
import type { AlertWithStatus } from "@/lib/universal-search/alerts";
import { fmtAlertValue } from "@/lib/universal-search/alerts";

const METRIC_OPTIONS: AlertMetric[] = [
  "lastPrice",
  "priceDailyChangePct",
  "ytdReturn",
  "dividendYield",
  "peRatio",
];

export function AlertsPanel({
  alerts,
  symbols,
  locale,
  onClose,
}: {
  alerts: AlertWithStatus[];
  symbols: { symbol: string; nameEn: string; nameAr: string }[];
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [symbol, setSymbol] = useState(symbols[0]?.symbol ?? "");
  const [metric, setMetric] = useState<AlertMetric>("lastPrice");
  const [op, setOp] = useState<AlertOp>("lte");
  const [threshold, setThreshold] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await createAssetAlert({ symbol, metric, op, threshold });
      setThreshold(0);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function destroy(id: string) {
    if (!confirm(t("alertConfirmDelete"))) return;
    setBusy(true);
    try {
      await deleteAssetAlert(id);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setBusy(true);
    try {
      await toggleAssetAlertActive({ id, active: !active });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const triggeredCount = alerts.filter((a) => a.triggered).length;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white relative">
              <Bell className="w-4 h-4" />
              {triggeredCount > 0 ? (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold grid place-items-center">
                  {triggeredCount}
                </span>
              ) : null}
            </span>
            <div>
              <h2 className="font-semibold">{t("alertsTitle")}</h2>
              <p className="text-xs text-muted">{t("alertsSubtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Create form */}
          <div className="card p-4 bg-cream/40 border-madkhol-100 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted">
              {t("alertNew")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="input py-2 text-sm"
              >
                {symbols.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {locale === "ar" ? s.nameAr : s.nameEn}
                  </option>
                ))}
              </select>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as AlertMetric)}
                className="input py-2 text-sm"
              >
                {METRIC_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t(`alertMetric_${m}`)}
                  </option>
                ))}
              </select>
              <select
                value={op}
                onChange={(e) => setOp(e.target.value as AlertOp)}
                className="input py-2 text-sm"
              >
                <option value="lte">{t("alertOp_lte")}</option>
                <option value="gte">{t("alertOp_gte")}</option>
              </select>
              <input
                type="number"
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="input py-2 text-sm tabular text-end"
                dir="ltr"
                placeholder={t("alertThresholdPlaceholder")}
              />
            </div>
            <button
              onClick={create}
              disabled={busy || !symbol}
              className="btn-gradient w-full"
            >
              <Plus className="w-4 h-4" />
              {t("alertCreate")}
            </button>
          </div>

          {error ? (
            <div className="card p-3 bg-red-50 border-red-200 flex items-start gap-2 text-sm text-red-700">
              <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {/* Alerts list */}
          {alerts.length === 0 ? (
            <p className="text-center text-sm text-muted py-8">
              {t("alertsEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id}>
                  <AlertRow
                    alert={a}
                    locale={locale}
                    t={t}
                    busy={busy}
                    onToggle={() => toggleActive(a.id, a.active)}
                    onDelete={() => destroy(a.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  locale,
  t,
  busy,
  onToggle,
  onDelete,
}: {
  alert: AlertWithStatus;
  locale: string;
  t: (k: string, v?: Record<string, string | number>) => string;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const symbolName = locale === "ar" ? alert.symbolNameAr : alert.symbolNameEn;
  return (
    <div
      className={cn(
        "card p-3 flex items-center gap-3 transition",
        alert.triggered
          ? "border-amber-300 bg-amber-50/60"
          : !alert.active
            ? "opacity-60"
            : "",
      )}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-xl grid place-items-center shrink-0",
          alert.triggered
            ? "bg-amber-500 text-white"
            : alert.active
              ? "bg-madkhol-50 text-madkhol-700"
              : "bg-ash-100 text-ash-500",
        )}
      >
        {alert.triggered ? (
          <Zap className="w-4 h-4 fill-current" />
        ) : alert.active ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          <span className="font-mono font-semibold">{alert.symbol}</span>
          {symbolName ? (
            <span className="text-muted text-xs ms-2 truncate">
              {symbolName}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted">
          {t(`alertMetric_${alert.metric}`)} {t(`alertOp_${alert.op}`)}{" "}
          <span className="font-medium text-deep tabular">
            {fmtAlertValue(alert.metric, alert.threshold)}
          </span>
          {alert.currentValue !== null ? (
            <>
              {" · "}
              {t("alertNow")}{" "}
              <span className="tabular">
                {fmtAlertValue(alert.metric, alert.currentValue)}
              </span>
            </>
          ) : null}
        </p>
      </div>
      {alert.triggered ? (
        <span className="badge-warning text-[10px]">{t("alertTriggered")}</span>
      ) : null}
      <button
        onClick={onToggle}
        disabled={busy}
        className="p-1.5 rounded-md text-ash-500 hover:text-deep hover:bg-ash-100"
        title={alert.active ? t("alertPause") : t("alertResume")}
      >
        {alert.active ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="p-1.5 rounded-md text-ash-500 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
