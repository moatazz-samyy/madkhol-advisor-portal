"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Sparkles, Save, CheckCircle2, ImageIcon } from "lucide-react";
import { saveWhiteLabel } from "@/app/[locale]/(app)/white-label/actions";

type Swatch = { key: "deep" | "madkhol" | "navy" | "charcoal"; color: string };

const SWATCHES: Swatch[] = [
  { key: "deep", color: "#0A2E1F" },
  { key: "madkhol", color: "#1F8A5A" },
  { key: "navy", color: "#1E3A5F" },
  { key: "charcoal", color: "#3D4843" },
];

const DEFAULT_FOOTER =
  "Madkhol Investment Advisory · Licensed by the Capital Market Authority";

export function WhiteLabelView({
  locale,
  advisorName,
  advisorNameAr,
  currentLogoUrl,
  currentBrandColor,
}: {
  locale: string;
  advisorName: string;
  advisorNameAr: string;
  currentLogoUrl: string | null;
  currentBrandColor: string;
}) {
  const t = useTranslations("whiteLabel");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [logoUrl, setLogoUrl] = useState(currentLogoUrl ?? "");
  const [brandColor, setBrandColor] = useState(currentBrandColor);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    try {
      await saveWhiteLabel({
        logoUrl: logoUrl.trim() || null,
        brandColor,
      });
      setSavedAt(Date.now());
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  const advisorDisplay = locale === "ar" ? advisorNameAr : advisorName;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-gradient">
          <Save className="w-4 h-4" />
          {saving ? t("saving") : t("save")}
        </button>
      </header>

      {savedAt ? (
        <div className="card p-3 bg-madkhol-50 border-madkhol-200 inline-flex items-center gap-2 text-sm text-madkhol-700">
          <CheckCircle2 className="w-4 h-4" />
          {t("saved")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Form */}
        <section className="card p-5 space-y-5">
          <div>
            <label className="label">{t("logoUrl")}</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="input"
              placeholder="https://…"
              dir="ltr"
            />
            <p className="text-xs text-muted mt-1">{t("logoUrlHint")}</p>
          </div>

          <div>
            <label className="label">{t("brandColor")}</label>
            <div className="grid grid-cols-2 gap-2">
              {SWATCHES.map((s) => {
                const active = s.color.toLowerCase() === brandColor.toLowerCase();
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setBrandColor(s.color)}
                    className={cn(
                      "card p-3 flex items-center gap-3 text-start transition",
                      active
                        ? "border-madkhol-500 shadow-ring"
                        : "border-border hover:border-madkhol-300",
                    )}
                  >
                    <span
                      className="w-8 h-8 rounded-lg shrink-0 shadow-card"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {t(`swatch_${s.key}`)}
                      </p>
                      <p className="text-[10px] text-muted font-mono">{s.color}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">{t("statementFooter")}</label>
            <textarea
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              rows={2}
              className="input resize-none text-sm"
            />
            <p className="text-xs text-muted mt-1">{t("statementFooterHint")}</p>
          </div>
        </section>

        {/* Live preview */}
        <section>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-madkhol-700" />
                {t("preview")}
              </h3>
            </div>
            <div className="p-8 bg-cream/50">
              {/* Mock statement */}
              <div className="bg-white rounded-2xl shadow-soft border border-border max-w-2xl mx-auto overflow-hidden">
                {/* Statement header — uses the advisor's brand color */}
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="absolute -end-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="relative flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {logoUrl.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur p-1 object-contain"
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).style.display = "none")
                          }
                        />
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur grid place-items-center">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                          {t("previewClientLabel")} · {t("previewMonth")}
                        </p>
                        <p className="text-lg font-semibold">{advisorDisplay}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                        {t("previewClientPlaceholder")}
                      </p>
                      <p className="text-sm font-medium">
                        {locale === "ar" ? "عبدالله القحطاني" : "Abdullah Al-Qahtani"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mock content */}
                <div className="p-6 space-y-3">
                  <div className="card p-3 bg-cream/40 border-border text-xs text-muted text-center">
                    {locale === "ar"
                      ? "محتوى الكشف الفعلي يُولَّد من بيانات العميل في PDF النهائي."
                      : "Real statement content is generated from client data in the final PDF."}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-cream/30 text-center">
                  <p className="text-[10px] text-ash-500">{footer}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
