"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  X,
  Check,
  Settings2,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import {
  ALL_OPTIONAL_COLUMNS,
  DEFAULT_COLUMNS,
  type ColumnKey,
  type NumericRange,
  type RangeFilters,
} from "@/lib/universal-search/types";
import { saveSearchPreferences } from "@/app/[locale]/(app)/search/actions";

// Display metadata + filter defaults for each column. Keeps the panel data-
// driven — adding a column is one entry here plus a column renderer in
// ResultsList. Filters that don't apply to a column (e.g. purification) carry
// `filterable: false`.
export const COLUMN_META: Record<
  ColumnKey,
  { i18nKey: string; filterable: boolean; defaultRange?: NumericRange; unit?: string }
> = {
  ytd:           { i18nKey: "colYtd",          filterable: false }, // already in primary sidebar
  return1Y:      { i18nKey: "col1Y",           filterable: true, defaultRange: [-50, 200], unit: "%" },
  return3Y:      { i18nKey: "col3Y",           filterable: true, defaultRange: [-20, 80], unit: "%" },
  volatility1Y:  { i18nKey: "colVol",          filterable: true, defaultRange: [0, 80], unit: "%" },
  peRatio:       { i18nKey: "colPE",           filterable: true, defaultRange: [0, 200], unit: "×" },
  dividendYield: { i18nKey: "colDividend",     filterable: true, defaultRange: [0, 15], unit: "%" },
  marketCap:     { i18nKey: "colMarketCap",    filterable: true, defaultRange: [0, 5000], unit: "B" },
  heldByClients: { i18nKey: "colHeldBy",       filterable: false }, // book context — sort, don't range
  nextEarnings:  { i18nKey: "colNextEarnings", filterable: false }, // date, not numeric range
  purification:  { i18nKey: "colPurification", filterable: false },
};

export function CustomizePanel({
  columns,
  ranges,
  onChange,
  onClose,
}: {
  columns: ColumnKey[];
  ranges: RangeFilters;
  onChange: (next: { columns: ColumnKey[]; ranges: RangeFilters }) => void;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [localColumns, setLocalColumns] = useState<ColumnKey[]>(columns);
  const [localRanges, setLocalRanges] = useState<RangeFilters>(ranges);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const localColumnSet = new Set(localColumns);

  function toggleColumn(key: ColumnKey) {
    if (localColumnSet.has(key)) {
      setLocalColumns(localColumns.filter((c) => c !== key));
      // Drop the range too — no column = no filter
      setLocalRanges((r) => {
        const next = { ...r };
        delete next[key as keyof RangeFilters];
        return next;
      });
    } else {
      setLocalColumns([...localColumns, key]);
    }
  }

  function setRange(key: ColumnKey, range: NumericRange | undefined) {
    setLocalRanges((r) => {
      const next = { ...r };
      if (range === undefined) {
        delete next[key as keyof RangeFilters];
      } else {
        next[key as keyof RangeFilters] = range;
      }
      return next;
    });
  }

  function resetDefaults() {
    setLocalColumns(DEFAULT_COLUMNS);
    setLocalRanges({});
  }

  async function save() {
    setSaving(true);
    try {
      const next = { columns: localColumns, ranges: localRanges };
      onChange(next);
      await saveSearchPreferences(next);
      setSaved(true);
      startTransition(() => router.refresh());
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

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
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
              <Settings2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t("customizeTitle")}</h2>
              <p className="text-xs text-muted">{t("customizeSubtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            {t("customizeColumnsHeader")}
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ALL_OPTIONAL_COLUMNS.map((key) => {
              const meta = COLUMN_META[key];
              const active = localColumnSet.has(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggleColumn(key)}
                    className={cn(
                      "w-full text-start p-3 rounded-xl border transition flex items-center gap-3",
                      active
                        ? "border-madkhol-500 bg-madkhol-50/40"
                        : "border-border bg-white hover:border-madkhol-300",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition",
                        active
                          ? "bg-madkhol-600 border-madkhol-600 text-white"
                          : "border-ash-300 bg-white",
                      )}
                    >
                      {active ? <Check className="w-3.5 h-3.5" /> : null}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {t(meta.i18nKey)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {localColumns.some((k) => COLUMN_META[k].filterable) ? (
            <>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold pt-2">
                {t("customizeFiltersHeader")}
              </p>
              <p className="text-xs text-muted">{t("customizeFiltersHint")}</p>
              <div className="space-y-3">
                {localColumns
                  .filter((k) => COLUMN_META[k].filterable)
                  .map((k) => {
                    const meta = COLUMN_META[k];
                    const enabled =
                      localRanges[k as keyof RangeFilters] !== undefined;
                    const range =
                      localRanges[k as keyof RangeFilters] ??
                      meta.defaultRange ??
                      [0, 100];
                    return (
                      <div
                        key={k}
                        className={cn(
                          "card p-3 transition",
                          enabled
                            ? "border-madkhol-300 bg-madkhol-50/30"
                            : "border-border bg-white",
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRange(
                                k,
                                enabled ? undefined : (meta.defaultRange ?? [0, 100]),
                              )
                            }
                            className={cn(
                              "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition",
                              enabled
                                ? "bg-madkhol-600 border-madkhol-600 text-white"
                                : "border-ash-300 bg-white",
                            )}
                          >
                            {enabled ? <Check className="w-3.5 h-3.5" /> : null}
                          </button>
                          <span className="text-sm font-medium flex-1">
                            {t(meta.i18nKey)}
                          </span>
                          {meta.unit ? (
                            <span className="text-[10px] text-muted uppercase">
                              {meta.unit}
                            </span>
                          ) : null}
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 transition",
                            !enabled && "opacity-40 pointer-events-none",
                          )}
                        >
                          <input
                            type="number"
                            value={range[0]}
                            onChange={(e) =>
                              setRange(k, [Number(e.target.value), range[1]])
                            }
                            className="input text-end tabular py-1.5"
                            dir="ltr"
                          />
                          <span className="text-ash-400 text-xs">—</span>
                          <input
                            type="number"
                            value={range[1]}
                            onChange={(e) =>
                              setRange(k, [range[0], Number(e.target.value)])
                            }
                            className="input text-end tabular py-1.5"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2 bg-ash-50/30">
          <button onClick={resetDefaults} className="btn-ghost text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            {t("customizeReset")}
          </button>
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="inline-flex items-center gap-1 text-xs text-madkhol-700 me-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("customizeSaved")}
              </span>
            ) : null}
            <button onClick={onClose} className="btn-outline">
              {t("customizeCancel")}
            </button>
            <button onClick={save} disabled={saving} className="btn-gradient">
              <Save className="w-3.5 h-3.5" />
              {saving ? t("customizeSaving") : t("customizeSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
