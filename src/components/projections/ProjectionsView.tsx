"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  Activity,
  ShieldAlert,
  History,
  Play,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtSar, fmtGregorian } from "@/lib/format";
import {
  TIME_HORIZONS_MONTHS,
  type Aggregates,
  type ConfidenceInterval,
  type HorizonMonths,
  type PercentileSeries,
  type ProjectionResult,
  type SubjectType,
} from "@/lib/projections/types";
import {
  runProjectionAction,
} from "@/app/[locale]/(app)/projections/actions";

type HistoryRow = {
  id: string;
  horizonMonths: number;
  confidenceInterval: number;
  monthlyContribution: number;
  monthlyWithdrawal: number;
  seed: number;
  startingAumSar: number;
  percentileResults: string;
  aggregates: string;
  createdAt: string;
};

export function ProjectionsView({
  locale,
  subjectType,
  subjectId,
  subject,
  history,
}: {
  locale: string;
  subjectType: SubjectType;
  subjectId: string | null;
  subject: { label: string; labelAr: string; assets: { symbol: string }[]; startingAumSar: number } | null;
  history: HistoryRow[];
}) {
  const t = useTranslations("projections");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [horizon, setHorizon] = useState<HorizonMonths>(12);
  const [contribution, setContribution] = useState(0);
  const [withdrawal, setWithdrawal] = useState(0);
  const [ci, setCi] = useState<ConfidenceInterval>(80);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [cached, setCached] = useState(false);

  async function run() {
    if (!subjectId) return;
    setRunning(true);
    try {
      const res = await runProjectionAction({
        subjectType,
        subjectId,
        horizonMonths: horizon,
        monthlyContributionSar: contribution,
        monthlyWithdrawalSar: withdrawal,
        confidenceInterval: ci,
      });
      setResult(res.result);
      setCached(res.cached);
      startTransition(() => router.refresh());
    } finally {
      setRunning(false);
    }
  }

  function loadHistorical(row: HistoryRow) {
    const percentiles = JSON.parse(row.percentileResults) as PercentileSeries;
    const aggregates = JSON.parse(row.aggregates) as Aggregates;
    setHorizon(row.horizonMonths as HorizonMonths);
    setContribution(row.monthlyContribution);
    setWithdrawal(row.monthlyWithdrawal);
    setCi(row.confidenceInterval as ConfidenceInterval);
    setResult({
      scenario: {
        subjectType,
        subjectId: subjectId ?? "",
        horizonMonths: row.horizonMonths as HorizonMonths,
        monthlyContributionSar: row.monthlyContribution,
        monthlyWithdrawalSar: row.monthlyWithdrawal,
        confidenceInterval: row.confidenceInterval as ConfidenceInterval,
        nRuns: 10_000,
        seed: row.seed,
      },
      percentiles,
      aggregates,
      assetsUsed: [],
    });
    setCached(true);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1 max-w-3xl">{t("subtitle")}</p>
      </header>

      {!subject ? (
        <div className="card p-12 text-center bg-brand-soft border-madkhol-100">
          <Sparkles className="w-7 h-7 text-madkhol-700 mx-auto mb-2" />
          <p className="text-deep font-medium">{t("noSubject")}</p>
        </div>
      ) : (
        <>
          {/* Subject hero */}
          <div className="card p-5 bg-brand-soft border-madkhol-100">
            <div className="flex flex-wrap items-end gap-6 justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">
                  {subjectType === "client_portfolio"
                    ? t("sourceClient", { name: locale === "ar" ? subject.labelAr : subject.label })
                    : t("sourceModelGeneric", { name: locale === "ar" ? subject.labelAr : subject.label })}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {locale === "ar" ? subject.labelAr : subject.label}
                </h2>
              </div>
              <div className="flex gap-6 text-end">
                <div>
                  <p className="text-xs uppercase text-muted">{t("startingAum")}</p>
                  <p className="text-xl font-semibold tabular">
                    {fmtSar(subject.startingAumSar)}{" "}
                    <span className="text-sm text-muted font-normal">SAR</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted">{t("assetCount", { n: subject.assets.length })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario panel */}
            <section className="card p-5 lg:col-span-1 space-y-5">
              <div>
                <label className="label">{t("horizon")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_HORIZONS_MONTHS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorizon(h)}
                      className={cn(
                        "p-2.5 rounded-xl border text-sm font-medium transition",
                        horizon === h
                          ? "border-madkhol-500 bg-madkhol-50/40 text-deep shadow-ring"
                          : "border-border bg-white text-ash-600 hover:border-madkhol-300",
                      )}
                    >
                      {t(`horizon${h}` as "horizon6")}
                    </button>
                  ))}
                </div>
              </div>

              <details className="border border-border rounded-xl p-3" open>
                <summary className="text-sm font-medium cursor-pointer">
                  {t("inputs")}
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="label">{t("monthlyContribution")}</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={contribution}
                      onChange={(e) => setContribution(Number(e.target.value))}
                      className="input text-end tabular py-2"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="label">{t("monthlyWithdrawal")}</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={withdrawal}
                      onChange={(e) => setWithdrawal(Number(e.target.value))}
                      className="input text-end tabular py-2"
                      dir="ltr"
                    />
                  </div>
                </div>
              </details>

              <div>
                <label className="label">{t("confidenceInterval")}</label>
                <div className="inline-flex bg-ash-100 rounded-xl p-1 w-full">
                  {[50, 80, 95].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCi(v as ConfidenceInterval)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-lg transition",
                        ci === v
                          ? "bg-white text-deep shadow-card"
                          : "text-ash-600 hover:text-deep",
                      )}
                    >
                      {t(`ci${v}` as "ci80")}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={run} disabled={running} className="btn-gradient w-full">
                {running ? t("running") : (
                  <>
                    <Play className="w-4 h-4" />
                    {t("run")}
                  </>
                )}
              </button>
              {cached && result ? (
                <p className="text-[10px] text-muted text-center inline-flex items-center gap-1 justify-center w-full">
                  <Info className="w-3 h-3" />
                  {t("cached")}
                </p>
              ) : null}

              {/* History */}
              <details className="border border-border rounded-xl p-3">
                <summary className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-ash-400" />
                  {t("history")}
                  <span className="badge-neutral text-[10px] ms-auto">{history.length}</span>
                </summary>
                {history.length === 0 ? (
                  <p className="text-xs text-muted text-center py-3">{t("historyEmpty")}</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {history.map((h) => {
                      const ag = JSON.parse(h.aggregates) as Aggregates;
                      const horizonLabel = t(`horizon${h.horizonMonths}` as "horizon6");
                      return (
                        <li key={h.id}>
                          <button
                            onClick={() => loadHistorical(h)}
                            className="w-full text-start p-2.5 rounded-lg hover:bg-ash-50 border border-border bg-white transition"
                          >
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-xs font-medium">{horizonLabel}</span>
                              <span className="text-[10px] text-muted">
                                {fmtGregorian(new Date(h.createdAt), locale as "ar" | "en")}
                              </span>
                            </div>
                            <p className="text-xs text-muted tabular mt-0.5">
                              {fmtSar(ag.medianFinalSar)} SAR ·{" "}
                              <span className="text-madkhol-700 font-medium">
                                {ag.expectedAnnualReturnPct.toFixed(1)}%
                              </span>
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </details>
            </section>

            {/* Results panel */}
            <section className="lg:col-span-2 space-y-4">
              {result ? (
                <ResultsPanel result={result} locale={locale} />
              ) : (
                <div className="card p-12 text-center bg-cream/30">
                  <Sparkles className="w-8 h-8 text-madkhol-700 mx-auto mb-2" />
                  <p className="text-sm text-muted">
                    {locale === "ar"
                      ? "اضغط «تشغيل المحاكاة» لعرض نتائج التوقّع هنا."
                      : "Click Run projection to see the simulation results here."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Results panel
// -----------------------------------------------------------------------------

function ResultsPanel({
  result,
  locale,
}: {
  result: ProjectionResult;
  locale: string;
}) {
  const t = useTranslations("projections");
  const { aggregates: a, percentiles: p, scenario } = result;

  // Build chart data per month
  const chartData = useMemo(() => {
    return p.months.map((m, i) => ({
      month: m,
      p5: p.p5[i],
      p95: p.p95[i],
      ciLower: p.ciLower[i],
      ciUpper: p.ciUpper[i],
      median: p.p50[i],
      inflation: p.inflationLine[i],
    }));
  }, [p]);

  const horizonYears = scenario.horizonMonths / 12;

  return (
    <div className="space-y-4">
      {/* Big number */}
      <div className="card p-6 bg-brand-gradient text-white relative overflow-hidden">
        <div className="absolute -end-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <p className="text-xs uppercase tracking-wider font-semibold text-white/80 mb-1">
          {t("median")} · {t("horizonEnd")} ·{" "}
          {locale === "ar"
            ? `${horizonYears} سنة`
            : `${horizonYears} ${horizonYears === 1 ? "year" : "years"}`}
        </p>
        <p className="text-4xl font-semibold tabular">
          {fmtSar(a.medianFinalSar)}{" "}
          <span className="text-lg font-normal text-white/80">SAR</span>
        </p>
        <p className="text-sm text-white/90 mt-2">
          {t("rangeWith", {
            lo: fmtSar(a.lowerCISar),
            hi: fmtSar(a.upperCISar),
            ci: scenario.confidenceInterval,
          })}
        </p>
      </div>

      {/* Fan chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold">{t("fanChartTitle")}</h3>
            <p className="text-xs text-muted">{t("fanChartHint")}</p>
          </div>
        </div>
        <div className="h-[320px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fan-outer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A8DDBA" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#A8DDBA" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fan-inner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6BE07F" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#6BE07F" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EEF2F0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#8A968F"
                fontSize={11}
                tickFormatter={(m) => `${m}m`}
                reversed={locale === "ar"}
              />
              <YAxis
                stroke="#8A968F"
                fontSize={11}
                width={80}
                orientation={locale === "ar" ? "right" : "left"}
                tickFormatter={(v) => fmtSar(v as number)}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E7ECE9", fontSize: 12 }}
                formatter={(v) => `${fmtSar(Number(v))} SAR`}
                labelFormatter={(m) => `Month ${m}`}
              />
              {/* Outer 5–95 band */}
              <Area
                type="monotone"
                dataKey="p95"
                stroke="none"
                fill="url(#fan-outer)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="p5"
                stroke="none"
                fill="#FAFBFA"
                fillOpacity={1}
              />
              {/* Inner CI band */}
              <Area
                type="monotone"
                dataKey="ciUpper"
                stroke="none"
                fill="url(#fan-inner)"
                fillOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="ciLower"
                stroke="none"
                fill="#FAFBFA"
                fillOpacity={1}
              />
              {/* Median */}
              <Line
                type="monotone"
                dataKey="median"
                stroke="#0C3D2E"
                strokeWidth={2.5}
                dot={false}
              />
              {/* Inflation reference */}
              <Line
                type="monotone"
                dataKey="inflation"
                stroke="#8A968F"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
              />
              <ReferenceLine
                y={a.startingAumSar}
                stroke="#D9E0DD"
                strokeWidth={1}
                strokeDasharray="2 4"
                label={{ value: "start", fill: "#8A968F", fontSize: 10, position: "insideTopRight" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
          <LegendDot color="#0C3D2E" label={locale === "ar" ? "الوسيط" : "Median"} solid />
          <LegendDot color="#6BE07F" label={`${t("confidenceInterval")} ${scenario.confidenceInterval}%`} />
          <LegendDot color="#A8DDBA" label={locale === "ar" ? "5-95٪" : "5-95%"} />
          <LegendDot color="#8A968F" label={locale === "ar" ? "تضخم 3٪" : "Inflation 3%"} dashed />
        </div>
      </div>

      {/* Key metrics table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold">{t("keyMetrics")}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
          <Metric label={t("metricProbPositive")} value={`${(a.probPositive * 100).toFixed(0)}%`} tone={a.probPositive >= 0.7 ? "good" : "neutral"} Icon={TrendingUp} />
          <Metric label={t("metricProbInflation")} value={`${(a.probBeatInflation * 100).toFixed(0)}%`} tone={a.probBeatInflation >= 0.6 ? "good" : "warn"} Icon={ShieldAlert} />
          <Metric label={t("metricExpRet")} value={`${a.expectedAnnualReturnPct.toFixed(1)}%`} tone="good" Icon={TrendingUp} />
          <Metric label={t("metricVol")} value={`${a.annualVolatilityPct.toFixed(1)}%`} Icon={Activity} />
          <Metric label={t("metricBest")} value={`${fmtSar(a.bestCaseSar)} SAR`} tone="good" />
          <Metric label={t("metricWorst")} value={`${fmtSar(a.worstCaseSar)} SAR`} tone="warn" />
        </div>
      </div>

      {/* Warnings */}
      {a.warnings.length > 0 ? (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
            {t("warnings")}
          </p>
          <ul className="text-xs text-amber-900 list-disc ps-5 space-y-1">
            {a.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* CMA disclaimer */}
      <div className="card p-4 bg-ash-50/60 border-ash-200">
        <p className="text-xs font-semibold text-ash-600 uppercase tracking-wider mb-1">
          {t("disclaimerTitle")}
        </p>
        <p className="text-xs text-ash-600 leading-relaxed">{t("disclaimerBody")}</p>
        <p className="text-[10px] text-ash-400 mt-2 tabular">
          {t("footerSeed", { seed: scenario.seed })} · {t("noteIdentical")}
        </p>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  solid,
  dashed,
}: {
  color: string;
  label: string;
  solid?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ash-600">
      <span
        className="w-3 h-3 rounded-sm shrink-0"
        style={{
          backgroundColor: solid ? color : undefined,
          border: !solid ? `2px ${dashed ? "dashed" : "solid"} ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
  Icon?: typeof TrendingUp;
}) {
  return (
    <div className="bg-white p-3.5">
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1 flex items-center gap-1.5">
        {Icon ? <Icon className="w-3 h-3" /> : null}
        {label}
      </p>
      <p
        className={cn(
          "text-base font-semibold tabular",
          tone === "good" && "text-madkhol-700",
          tone === "warn" && "text-amber-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}
