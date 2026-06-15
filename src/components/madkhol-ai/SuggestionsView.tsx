"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  CheckCircle2,
  X,
  TrendingUp,
  TrendingDown,
  Brain,
  ArrowRight,
  Plug2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { MockSuggestion } from "@/lib/madkhol-ai/data";

type Verdict = "pending" | "approved" | "rejected";

export function SuggestionsView({
  locale,
  connected,
  suggestions,
}: {
  locale: string;
  connected: boolean;
  suggestions: MockSuggestion[];
}) {
  const t = useTranslations("madkholAi");

  // Local state — these buttons are intentional stubs per spec; no DB writes
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, verdict: "approved" | "rejected") {
    setBusy(id);
    // Tiny fake-latency so the button doesn't snap; gives the demo a beat
    await new Promise((r) => setTimeout(r, 350));
    setVerdicts((v) => ({ ...v, [id]: verdict }));
    setBusy(null);
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("suggestionsTitle")}
          </h1>
          <p className="text-muted mt-1">{t("suggestionsSubtitle")}</p>
        </header>
        <div className="card p-12 text-center bg-brand-soft border-madkhol-200">
          <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center text-madkhol-700 shadow-card mx-auto mb-4">
            <Plug2 className="w-6 h-6" />
          </div>
          <p className="text-deep font-medium mb-4">
            {locale === "ar"
              ? "اتصل بمدخول الذكي لاستلام الاقتراحات."
              : "Connect Madkhol AI to start receiving suggestions."}
          </p>
          <Link href={`/${locale}/madkhol-ai`} className="btn-gradient">
            <Sparkles className="w-4 h-4" />
            {t("heroConnect")}
          </Link>
        </div>
      </div>
    );
  }

  const pending = suggestions.filter((s) => (verdicts[s.id] ?? "pending") === "pending");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("suggestionsTitle")}
          </h1>
          <p className="text-muted mt-1">{t("suggestionsSubtitle")}</p>
        </div>
        <span className="badge-success">
          <Sparkles className="w-3.5 h-3.5" />
          {t("suggestionsPending", { n: pending.length })}
        </span>
      </header>

      {suggestions.length === 0 ? (
        <p className="text-center text-muted py-14">{t("suggestionsEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => {
            const verdict = verdicts[s.id] ?? "pending";
            const isBuy = s.side === "buy";
            return (
              <li key={s.id}>
                <div
                  className={cn(
                    "card p-5",
                    verdict === "approved" && "bg-madkhol-50/40 border-madkhol-300",
                    verdict === "rejected" && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* AI icon + confidence ring */}
                    <div className="relative w-14 h-14 shrink-0">
                      <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-25 blur-md" />
                      <div className="relative w-14 h-14 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-soft">
                        <Brain className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
                            isBuy
                              ? "bg-madkhol-700 text-white"
                              : "bg-ash-600 text-white",
                          )}
                        >
                          {isBuy ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isBuy ? t("suggestion_side_buy") : t("suggestion_side_sell")}
                        </span>
                        <span className="font-mono font-bold text-lg text-deep">
                          {s.symbol}
                        </span>
                        <span className="text-sm text-muted">
                          {s.quantity}{" "}
                          {locale === "ar" ? "سهم" : "shares"}
                        </span>
                        <span className="text-xs text-ash-400">
                          ·{" "}
                          {t("suggestion_for", {
                            client:
                              locale === "ar" ? s.forClientNameAr : s.forClientName,
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {locale === "ar" ? s.nameAr : s.nameEn}
                      </p>
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <ConfidenceMeter pct={s.confidencePct} t={t} />
                      </div>
                      <p className="text-sm text-muted mt-3 leading-relaxed">
                        <span className="text-xs font-semibold text-deep">
                          {t("thesis")}:{" "}
                        </span>
                        {locale === "ar" ? s.thesisAr : s.thesisEn}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {verdict === "pending" ? (
                        <>
                          <button
                            onClick={() => act(s.id, "rejected")}
                            disabled={busy === s.id}
                            className="btn-outline text-ash-600 hover:text-red-600 text-sm"
                          >
                            <X className="w-4 h-4" />
                            {t("reject")}
                          </button>
                          <button
                            onClick={() => act(s.id, "approved")}
                            disabled={busy === s.id}
                            className="btn-gradient text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {busy === s.id ? t("approving") : t("approve")}
                          </button>
                        </>
                      ) : verdict === "approved" ? (
                        <span className="badge-success text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("approved")}
                        </span>
                      ) : (
                        <span className="badge-neutral text-sm">
                          <X className="w-3.5 h-3.5" />
                          {t("rejected")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="card p-4 bg-cream/60 text-xs text-muted text-center">
        {locale === "ar"
          ? "هذه الاقتراحات تجريبية فقط — يصدرها المحرك الفعلي عند تشغيله في مرحلة لاحقة."
          : "These are demo suggestions — the real engine generates them in a later phase."}{" "}
        <Link
          href={`/${locale}/madkhol-ai`}
          className="text-deep hover:underline inline-flex items-center gap-0.5"
        >
          {t("heroLearnMore")}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function ConfidenceMeter({
  pct,
  t,
}: {
  pct: number;
  t: (k: string) => string;
}) {
  const tone =
    pct >= 80
      ? "bg-madkhol-700"
      : pct >= 65
      ? "bg-madkhol-500"
      : "bg-amber-500";
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-semibold text-muted">{t("confidence")}</span>
      <div className="w-24 h-2 rounded-full bg-ash-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular text-deep">{pct}%</span>
    </div>
  );
}
