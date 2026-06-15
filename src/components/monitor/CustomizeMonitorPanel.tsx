"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { X, Settings2, Save, RotateCcw, Check, CheckCircle2 } from "lucide-react";
import { saveMonitorPreferences } from "@/app/[locale]/(app)/monitor/actions";
import {
  ALL_WIDGETS,
  DEFAULT_WIDGETS,
  type WidgetKey,
} from "@/lib/monitor/registry";

export function CustomizeMonitorPanel({
  active,
  onChange,
  onClose,
}: {
  active: WidgetKey[];
  onChange: (next: WidgetKey[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("monitor");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [local, setLocal] = useState<WidgetKey[]>(active);
  const localSet = new Set(local);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: WidgetKey) {
    if (localSet.has(key)) {
      setLocal(local.filter((k) => k !== key));
    } else {
      setLocal([...local, key]);
    }
  }

  function reset() {
    setLocal(DEFAULT_WIDGETS);
  }

  async function save() {
    setSaving(true);
    try {
      onChange(local);
      await saveMonitorPreferences({ widgets: local });
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
        className="card w-full max-w-xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[85vh]"
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

        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {ALL_WIDGETS.map((key) => {
            const isActive = localSet.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  "w-full text-start p-3 rounded-xl border transition flex items-center gap-3",
                  isActive
                    ? "border-madkhol-500 bg-madkhol-50/40"
                    : "border-border bg-white hover:border-madkhol-300",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition",
                    isActive
                      ? "bg-madkhol-600 border-madkhol-600 text-white"
                      : "border-ash-300 bg-white",
                  )}
                >
                  {isActive ? <Check className="w-3.5 h-3.5" /> : null}
                </span>
                <span className="flex-1 text-sm font-medium">{t(`widget_${key}`)}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  {t(`widgetDesc_${key}`)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2 bg-ash-50/30">
          <button onClick={reset} className="btn-ghost text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            {t("reset")}
          </button>
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="inline-flex items-center gap-1 text-xs text-madkhol-700 me-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("saved")}
              </span>
            ) : null}
            <button onClick={onClose} className="btn-outline">
              {t("cancel")}
            </button>
            <button onClick={save} disabled={saving} className="btn-gradient">
              <Save className="w-3.5 h-3.5" />
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
