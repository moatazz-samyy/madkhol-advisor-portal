"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  Pencil,
  PlusCircle,
  Sparkles,
  Trash2,
  PlayCircle,
  Plus,
  X,
  Search,
  Sliders,
  LineChart as LineChartIcon,
} from "lucide-react";
import { saveModel, deleteModel } from "@/app/[locale]/(app)/models/actions";

type Fund = {
  id: string;
  nameEn: string;
  nameAr: string;
  manager: string;
  assetClass: string;
  shariahCompliant: boolean;
};

type Model = {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  holdingsCount: number;
  clientsCount: number;
  targetHoldings: Record<string, number>;
};

export function ModelsView({
  locale,
  models,
  funds,
}: {
  locale: string;
  models: Model[];
  funds: Fund[];
}) {
  const t = useTranslations("models");
  const [editor, setEditor] = useState<Model | "new" | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onSaved() {
    setEditor(null);
    startTransition(() => router.refresh());
  }

  async function onDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await deleteModel(id);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>
        <button onClick={() => setEditor("new")} className="btn-gradient">
          <PlusCircle className="w-4 h-4" />
          {t("create")}
        </button>
      </header>

      {models.length === 0 ? (
        <div className="card p-12 text-center bg-brand-soft border-madkhol-100">
          <Sparkles className="w-6 h-6 text-madkhol-700 mx-auto mb-3" />
          <p className="text-deep font-medium">
            {locale === "ar"
              ? "أنشئ أول محفظة نموذجية لتطبيقها بنقرة واحدة على عملائك."
              : "Create your first model portfolio to apply across your book in one click."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map((m) => (
            <li key={m.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {locale === "ar" ? m.nameAr : m.name}
                </h3>
                <span className="badge-neutral">
                  {m.holdingsCount} {locale === "ar" ? "صناديق" : "funds"}
                </span>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-4">{m.description}</p>
              <p className="text-xs text-ash-500 mb-4">
                {m.clientsCount}{" "}
                {locale === "ar" ? "عميل يستخدم هذا النموذج" : "clients using this model"}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/rebalance?model=${m.id}`}
                  className="btn-gradient text-xs flex-1 justify-center"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {t("applyToClients")}
                </Link>
                <Link
                  href={`/${locale}/projections?subject=model_generic&id=${m.id}`}
                  className="btn-outline text-xs"
                  aria-label="Project performance"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/${locale}/optimizer?source=model&id=${m.id}`}
                  className="btn-outline text-xs"
                  aria-label="Optimize weights"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setEditor(m)}
                  className="btn-outline text-xs"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="btn-ghost text-xs text-ash-500 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor ? (
        <ModelEditorModal
          model={editor === "new" ? null : editor}
          funds={funds}
          locale={locale}
          onClose={() => setEditor(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}

// ---- Editor modal ----

function ModelEditorModal({
  model,
  funds,
  locale,
  onClose,
  onSaved,
}: {
  model: Model | null;
  funds: Fund[];
  locale: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("models");
  const ta = useTranslations("asset");
  const [name, setName] = useState(model?.name ?? "");
  const [nameAr, setNameAr] = useState(model?.nameAr ?? "");
  const [description, setDescription] = useState(model?.description ?? "");
  const [shariahOnly, setShariahOnly] = useState(true);
  const [allocations, setAllocations] = useState<Record<string, number>>(
    model?.targetHoldings ?? {},
  );
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleFunds = useMemo(() => {
    const pool = shariahOnly ? funds.filter((f) => f.shariahCompliant) : funds;
    const needle = q.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter(
      (f) =>
        f.nameEn.toLowerCase().includes(needle) ||
        f.nameAr.includes(q.trim()) ||
        f.manager.toLowerCase().includes(needle),
    );
  }, [funds, shariahOnly, q]);

  const total = useMemo(
    () => Object.values(allocations).reduce((s, v) => s + v, 0),
    [allocations],
  );

  function setWeight(fundId: string, weight: number) {
    setAllocations((cur) => {
      const next = { ...cur };
      if (!weight || isNaN(weight)) {
        delete next[fundId];
      } else {
        next[fundId] = Math.max(0, Math.min(99, weight));
      }
      return next;
    });
  }

  function remove(fundId: string) {
    setAllocations((cur) => {
      const next = { ...cur };
      delete next[fundId];
      return next;
    });
  }

  async function save() {
    setError(null);
    if (!name.trim() || !nameAr.trim()) {
      setError(locale === "ar" ? "الاسم بالعربية والإنجليزية مطلوب." : "Name in both languages is required.");
      return;
    }
    if (Math.abs(total - 99) > 0.5) {
      setError(t("weightWarning"));
      return;
    }
    setSaving(true);
    try {
      await saveModel({
        id: model?.id,
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        targetHoldings: allocations,
      });
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const fundById = new Map(funds.map((f) => [f.id, f]));
  const totalOk = Math.abs(total - 99) <= 0.5;

  return (
    <div
      className="fixed inset-0 bg-deep/40 backdrop-blur-sm z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-3xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {model ? t("edit") : t("create")}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("name")} (EN)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Balanced"
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">{t("nameAr")}</label>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="متوازن"
                className="input"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="label">{t("description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Current allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">
                {t("holdings")} ({Object.keys(allocations).length})
              </label>
              <span
                className={cn(
                  "text-xs font-medium tabular",
                  totalOk ? "text-madkhol-700" : "text-amber-700",
                )}
              >
                {t("totalAllocation")}: {total.toFixed(1)}% / 99% ({t("cashReserve")} 1%)
              </span>
            </div>
            {Object.keys(allocations).length === 0 ? (
              <p className="text-sm text-muted py-6 text-center card">
                {t("noHoldings")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {Object.entries(allocations).map(([fundId, weight]) => {
                  const f = fundById.get(fundId);
                  if (!f) return null;
                  return (
                    <li
                      key={fundId}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-white"
                    >
                      <span className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {locale === "ar" ? f.nameAr : f.nameEn}
                        </p>
                        <p className="text-xs text-muted">
                          {f.manager} · {ta(f.assetClass)}
                        </p>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          step={1}
                          value={weight}
                          onChange={(e) => setWeight(fundId, +e.target.value)}
                          className="input w-20 text-end py-1.5 px-2 tabular"
                          dir="ltr"
                        />
                        <span className="text-sm text-muted">%</span>
                        <button
                          onClick={() => remove(fundId)}
                          className="text-ash-400 hover:text-red-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Fund picker */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <label className="label !mb-0">{t("addFund")}</label>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={shariahOnly}
                  onChange={(e) => setShariahOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-madkhol-600"
                />
                {t("shariahOnly")}
              </label>
            </div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={locale === "ar" ? "ابحث…" : "Search…"}
                className="input ps-9"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto space-y-1 pe-1">
              {visibleFunds.slice(0, 20).map((f) => {
                const used = allocations[f.id] !== undefined;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      disabled={used}
                      onClick={() => setWeight(f.id, 10)}
                      className={cn(
                        "w-full text-start p-2.5 rounded-xl border flex items-center gap-3 transition",
                        used
                          ? "border-border bg-ash-50 opacity-50 cursor-not-allowed"
                          : "border-border bg-white hover:border-madkhol-300",
                      )}
                    >
                      <Plus className="w-4 h-4 text-ash-400" />
                      <span className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {locale === "ar" ? f.nameAr : f.nameEn}
                        </p>
                        <p className="text-xs text-muted">
                          {f.manager} · {ta(f.assetClass)}
                        </p>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 ms-auto">
            <button onClick={onClose} className="btn-outline">
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={save}
              disabled={saving || !totalOk}
              className="btn-gradient"
            >
              {saving
                ? locale === "ar" ? "جاري الحفظ…" : "Saving…"
                : locale === "ar" ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
