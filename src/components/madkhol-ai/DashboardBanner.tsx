"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight, CheckCircle2, Plug2 } from "lucide-react";
import { ConnectModal } from "./ConnectModal";

export function DashboardBanner({
  locale,
  connected,
  pendingSuggestions,
}: {
  locale: string;
  connected: boolean;
  pendingSuggestions: number;
}) {
  const t = useTranslations("madkholAi");
  const [showModal, setShowModal] = useState(false);

  if (connected) {
    return (
      <div className="card overflow-hidden border-madkhol-200 bg-brand-soft p-5 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white grid place-items-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold text-deep">{t("bannerConnected")}</p>
          <p className="text-sm text-muted">
            {t("bannerSuggestions", { n: pendingSuggestions })}
          </p>
        </div>
        <Link
          href={`/${locale}/madkhol-ai/suggestions`}
          className="btn-gradient text-sm"
        >
          <Sparkles className="w-4 h-4" />
          {t("bannerViewSuggestions")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden relative border-transparent">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full bg-white/15 blur-3xl -top-16 -end-10 animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute w-64 h-64 rounded-full bg-madkhol-300/20 blur-3xl -bottom-16 -start-10 animate-[pulse_10s_ease-in-out_infinite]" />
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:28px_28px]" />
        </div>
        <div className="relative p-6 md:p-7 flex items-center gap-5 flex-wrap text-white">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-white/15">
                {t("newBadge")}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/80">
                Madkhol AI
              </span>
            </div>
            <h3 className="font-semibold text-lg md:text-xl leading-tight">
              {t("bannerHeadline")}
            </h3>
            <p className="text-sm text-white/85 mt-1 max-w-2xl">
              {t("bannerSubtext")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-deep font-medium shadow-card hover:bg-cream transition text-sm"
            >
              <Plug2 className="w-4 h-4" />
              {t("bannerCta")}
            </button>
            <Link
              href={`/${locale}/madkhol-ai`}
              className="hidden md:inline-flex items-center gap-1 text-sm text-white/80 hover:text-white px-3 py-2"
            >
              {t("heroLearnMore")}
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {showModal ? (
        <ConnectModal locale={locale} onClose={() => setShowModal(false)} />
      ) : null}
    </>
  );
}
