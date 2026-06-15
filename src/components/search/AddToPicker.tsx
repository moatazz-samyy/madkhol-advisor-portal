"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import { X, PieChart, Briefcase, CheckCircle2 } from "lucide-react";
import {
  addAssetsToModel,
  addAssetsToClient,
} from "@/app/[locale]/(app)/search/actions";

type Model = { id: string; name: string; nameAr: string; holdingsCount: number };
type Client = { id: string; name: string; nameAr: string; aumSar: number };

type Mode = "model" | "client";

export function AddToPicker({
  mode,
  models,
  clients,
  symbols,
  locale,
  onClose,
  onDone,
}: {
  mode: Mode;
  models: Model[];
  clients: Client[];
  symbols: string[];
  locale: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("search");
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ count: number } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function apply() {
    if (!picked) return;
    setSaving(true);
    try {
      const res =
        mode === "model"
          ? await addAssetsToModel(picked, symbols)
          : await addAssetsToClient(picked, symbols);
      setDone({ count: res.added });
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.35)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            {mode === "model" ? (
              <PieChart className="w-4 h-4 text-madkhol-600" />
            ) : (
              <Briefcase className="w-4 h-4 text-madkhol-600" />
            )}
            {mode === "model" ? t("pickModelTitle") : t("pickClientTitle")}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-madkhol-50 grid place-items-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-madkhol-700" />
            </div>
            <p className="font-medium">
              {mode === "model"
                ? t("successModel", { n: done.count })
                : t("successClient", { n: done.count })}
            </p>
            <button onClick={onDone} className="btn-gradient mt-6">
              {locale === "ar" ? "تم" : "Done"}
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-muted mb-4">
                {mode === "model" ? t("pickModelHint") : t("pickClientHint")}
              </p>
              {mode === "model" ? (
                <ul className="space-y-2">
                  {models.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => setPicked(m.id)}
                        className={cn(
                          "w-full text-start p-3.5 rounded-xl border transition flex items-center gap-3",
                          picked === m.id
                            ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                            : "border-border bg-white hover:border-madkhol-300",
                        )}
                      >
                        <PieChart className="w-4 h-4 text-ash-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {locale === "ar" ? m.nameAr : m.name}
                          </p>
                          <p className="text-xs text-muted">
                            {m.holdingsCount}{" "}
                            {locale === "ar" ? "صناديق" : "holdings"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pe-1">
                  {clients.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setPicked(c.id)}
                        className={cn(
                          "w-full text-start p-3 rounded-xl border transition flex items-center gap-3",
                          picked === c.id
                            ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                            : "border-border bg-white hover:border-madkhol-300",
                        )}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {locale === "ar" ? c.nameAr : c.name}
                          </p>
                          <p className="text-xs text-muted tabular">
                            {fmtSar(c.aumSar)} SAR
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              <button onClick={onClose} className="btn-outline">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={apply}
                disabled={!picked || saving}
                className="btn-gradient"
              >
                {saving
                  ? locale === "ar" ? "جاري…" : "Applying…"
                  : mode === "model" ? t("applyToModel") : t("applyToClient")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
