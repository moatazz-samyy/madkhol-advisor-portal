"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Sparkles,
  Brain,
  TrendingUp,
  ShieldCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plug2,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtGregorian } from "@/lib/format";
import { ConnectModal } from "./ConnectModal";
import { disconnectMadkholAi } from "@/app/[locale]/(app)/madkhol-ai/actions";
import type { AiConnection } from "@/lib/madkhol-ai/data";

type PerfRow = { month: string; madkholAi: number; sp500: number };

export function MadkholAiLanding({
  locale,
  connection,
  performance,
  edgePct,
}: {
  locale: string;
  connection: AiConnection;
  performance: PerfRow[];
  edgePct: number;
}) {
  const t = useTranslations("madkholAi");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [disconnecting, setDisconnecting] = useState(false);
  const [, startTransition] = useTransition();

  async function disconnect() {
    if (!confirm(t("disconnectConfirm"))) return;
    setDisconnecting(true);
    try {
      await disconnectMadkholAi();
      startTransition(() => router.refresh());
    } finally {
      setDisconnecting(false);
    }
  }

  const faqs = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-12 pb-12">
      {/* HERO */}
      <section className="relative card overflow-hidden border-transparent">
        <div className="absolute inset-0 bg-brand-gradient" />
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-white/15 blur-3xl -top-20 -end-20 animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute w-96 h-96 rounded-full bg-madkhol-300/25 blur-3xl -bottom-40 -start-20 animate-[pulse_10s_ease-in-out_infinite]" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:32px_32px]" />
        </div>
        <div className="relative px-8 md:px-12 py-14 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Madkhol AI
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            {t("heroSubtitle")}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/95 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-semibold">{t("minInvestmentTitle")}</span>
            <span className="text-white/70">·</span>
            <span>{t("minInvestmentHint")}</span>
          </div>

          <div className="mt-8 flex items-center gap-3 flex-wrap">
            {connection.connected ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-deep font-medium shadow-soft">
                <CheckCircle2 className="w-4 h-4 text-madkhol-700" />
                {t("bannerConnected")}
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-deep font-semibold shadow-soft hover:bg-cream transition"
              >
                <Plug2 className="w-4 h-4" />
                {t("heroConnect")}
              </button>
            )}
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 transition text-sm"
            >
              {t("heroLearnMore")}
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <h2 className="text-2xl font-semibold text-center mb-2">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Step number={1} title={t("step1Title")} desc={t("step1Desc")} Icon={Plug2} />
          <Step number={2} title={t("step2Title")} desc={t("step2Desc")} Icon={Brain} />
          <Step number={3} title={t("step3Title")} desc={t("step3Desc")} Icon={ShieldCheck} />
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <h2 className="text-2xl font-semibold text-center mb-8">
          {t("featuresTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature Icon={Brain}      title={t("feature1Title")} desc={t("feature1Desc")} />
          <Feature Icon={TrendingUp} title={t("feature2Title")} desc={t("feature2Desc")} />
          <Feature Icon={Activity}   title={t("feature3Title")} desc={t("feature3Desc")} />
          <Feature Icon={ShieldCheck} title={t("feature4Title")} desc={t("feature4Desc")} />
        </div>
      </section>

      {/* PERFORMANCE CHART */}
      <section>
        <div className="card p-6">
          <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("perfTitle")}
              </h2>
              <p className="text-sm text-muted">{t("perfSubtitle")}</p>
            </div>
            <span className="badge-success text-sm tabular">
              <TrendingUp className="w-4 h-4" />
              {t("perfEdgeNote", { n: edgePct })}
            </span>
          </div>
          <div className="h-[320px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <LineChart data={performance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#EEF2F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#8A968F"
                  fontSize={11}
                  reversed={locale === "ar"}
                />
                <YAxis
                  stroke="#8A968F"
                  fontSize={11}
                  orientation={locale === "ar" ? "right" : "left"}
                  width={50}
                  domain={[95, "auto"]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E7ECE9", fontSize: 12 }}
                  formatter={(v) => `${Number(v).toFixed(1)}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="madkholAi"
                  name={t("perfMadkholAi")}
                  stroke="#2BBE7E"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sp500"
                  name={t("perfSp500")}
                  stroke="#5E6964"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-semibold text-center mb-8">{t("faqTitle")}</h2>
        <div className="card divide-y divide-border max-w-3xl mx-auto">
          {faqs.map((i, idx) => (
            <details
              key={i}
              open={openFaq === idx}
              onToggle={(e) =>
                (e.currentTarget as HTMLDetailsElement).open
                  ? setOpenFaq(idx)
                  : setOpenFaq(null)
              }
              className="group"
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-ash-50/40 list-none">
                <span className="font-medium">{t(`faq${i}Q`)}</span>
                <span className="text-ash-400 group-open:hidden">
                  <ChevronDown className="w-4 h-4" />
                </span>
                <span className="text-ash-400 hidden group-open:inline">
                  <ChevronUp className="w-4 h-4" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm text-muted">{t(`faq${i}A`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="card p-10 text-center bg-brand-soft border-madkhol-200">
        <p className="text-lg font-medium text-deep mb-5">{t("bottomCta")}</p>
        {connection.connected ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-deep font-medium shadow-card">
              <CheckCircle2 className="w-4 h-4 text-madkhol-700" />
              {t("bannerConnected")}
            </div>
            {connection.connectedAt ? (
              <p className="text-xs text-muted">
                {t("connectionFooter", {
                  date: fmtGregorian(connection.connectedAt, locale as "ar" | "en"),
                  level: t(`level_${connection.engagementLevel ?? "suggestions_only"}`),
                })}
              </p>
            ) : null}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
              <Link
                href={`/${locale}/madkhol-ai/suggestions`}
                className="btn-gradient"
              >
                <Sparkles className="w-4 h-4" />
                {t("modalGoToSuggestions")}
              </Link>
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="btn-outline text-ash-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                {t("disconnect")}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowModal(true)} className="btn-gradient">
            <Plug2 className="w-4 h-4" />
            {t("heroConnect")}
          </button>
        )}
      </section>

      {showModal ? (
        <ConnectModal locale={locale} onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  );
}

function Step({
  number,
  title,
  desc,
  Icon,
}: {
  number: number;
  title: string;
  desc: string;
  Icon: typeof Plug2;
}) {
  return (
    <div className="card p-6 relative">
      <span className="absolute -top-3 start-6 text-[10px] font-bold tracking-widest px-2 py-1 rounded-md bg-brand-gradient text-white">
        STEP {number}
      </span>
      <div className="w-12 h-12 rounded-xl bg-madkhol-50 text-madkhol-700 grid place-items-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted mt-1">{desc}</p>
    </div>
  );
}

function Feature({
  Icon,
  title,
  desc,
}: {
  Icon: typeof Brain;
  title: string;
  desc: string;
}) {
  return (
    <div className={cn("card p-5 relative overflow-hidden")}>
      <span
        className="absolute -end-6 -top-6 w-20 h-20 rounded-full bg-madkhol-50/50 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="w-10 h-10 rounded-xl bg-brand-gradient text-white grid place-items-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
