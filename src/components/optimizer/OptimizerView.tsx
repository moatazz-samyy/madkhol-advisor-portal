"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Lock,
  Sparkles,
  Plus,
  X,
  Briefcase,
  PieChart as PieIcon,
  CheckCircle2,
  Pencil,
  Save,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  type OptimizationConfig,
  type OptimizationMethod,
  type OptimizationResult,
  type OptimizerAssetInput,
} from "@/lib/optimizer/types";
import { optimize, applyOptimizedToModel, applyOptimizedToClient } from "@/app/[locale]/(app)/optimizer/actions";
import type { GicsSector } from "@/lib/universal-search/types";

const ALL_SECTORS: GicsSector[] = [
  "tech", "healthcare", "financials", "consumer_discretionary",
  "consumer_staples", "communication", "industrials", "energy",
  "materials", "utilities", "real_estate", "diversified",
];

const METHODS: OptimizationMethod[] = [
  "mean_variance",
  "risk_parity",
  "equal_weight",
  "black_litterman",
];

const PALETTE = [
  "#0C3D2E", "#156E47", "#2BBE7E", "#6BE07F", "#A8DDBA",
  "#DCEFD0", "#F5C66B", "#D9E0DD", "#5E6964", "#0A2E1F",
];

type Source = {
  kind: "search" | "model" | "client";
  id?: string;
  label: string;
  labelAr: string;
  assets: OptimizerAssetInput[];
};

export function OptimizerView({
  locale,
  source,
}: {
  locale: string;
  source: Source;
}) {
  const t = useTranslations("optimizer");
  const ta = useTranslations("search"); // reused sector + class labels
  const router = useRouter();

  const [method, setMethod] = useState<OptimizationMethod>("mean_variance");
  const [riskTolerance, setRiskTolerance] = useState(0.6);
  const [riskFreeRate, setRiskFreeRate] = useState(0.04);
  const [sectorCaps, setSectorCaps] = useState<Partial<Record<GicsSector, number>>>({});
  const [perAssetBounds, setPerAssetBounds] = useState<Record<string, { min: number; max: number }>>({});

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [tweaking, setTweaking] = useState(false);
  const [tweakedWeights, setTweakedWeights] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();
  const [applyDone, setApplyDone] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    setTweaking(false);
    try {
      const config: OptimizationConfig = {
        method,
        riskTolerance,
        riskFreeRateAnnual: riskFreeRate,
        enforceShariah: true,
        cashReservePct: 1,
        sectorCaps: Object.keys(sectorCaps).length ? sectorCaps : undefined,
        perAssetBounds:
          Object.keys(perAssetBounds).length ? perAssetBounds : undefined,
      };
      const r = await optimize(source.assets, config);
      setResult(r);
      setTweakedWeights(Object.fromEntries(r.weights.map((w) => [w.symbol, w.weight])));
    } finally {
      setRunning(false);
    }
  }

  async function apply() {
    if (!result) return;
    const weights = tweaking
      ? Object.entries(tweakedWeights).map(([symbol, weight]) => ({ symbol, weight }))
      : result.weights.map((w) => ({ symbol: w.symbol, weight: w.weight }));

    if (source.kind === "model" && source.id) {
      const r = await applyOptimizedToModel(source.id, weights);
      setApplyDone(t("applied", { n: r.updated }));
    } else if (source.kind === "client" && source.id) {
      const r = await applyOptimizedToClient(source.id, weights);
      setApplyDone(t("appliedTrades", { n: r.trades }));
    } else {
      // Search-source — no target to apply to; suggest moving to model picker
      setApplyDone(
        locale === "ar"
          ? "اختر نموذجاً أو عميلاً من الشريط الجانبي لتطبيق هذه الأوزان."
          : "Pick a model or client from the sidebar to apply these weights.",
      );
    }
    startTransition(() => router.refresh());
  }

  const tweakSum = Object.values(tweakedWeights).reduce((s, v) => s + v, 0);
  const tweakValid = Math.abs(tweakSum - 99) < 0.5;

  if (source.assets.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </header>
        <div className="card p-12 text-center bg-brand-soft border-madkhol-100">
          <Sparkles className="w-7 h-7 text-madkhol-700 mx-auto mb-2" />
          <p className="text-deep font-medium">{t("noAssets")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1 max-w-3xl">{t("subtitle")}</p>
        </div>
        <span className="badge-neutral">
          {source.kind === "search" ? t("sourceSearch") : null}
          {source.kind === "model"
            ? t("sourceModel", { name: locale === "ar" ? source.labelAr : source.label })
            : null}
          {source.kind === "client"
            ? t("sourceClient", { name: locale === "ar" ? source.labelAr : source.label })
            : null}
        </span>
      </header>

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">{t("step1")}</h3>
          <span className="text-xs text-muted">{source.assets.length}</span>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>{ta("colSector")}</th>
              <th className="text-end">{t("currentCol")}</th>
              <th className="text-end">Shariah</th>
            </tr>
          </thead>
          <tbody>
            {source.assets.map((a) => (
              <tr key={a.symbol}>
                <td className="font-mono font-semibold text-deep">{a.symbol}</td>
                <td>{locale === "ar" ? a.nameAr : a.nameEn}</td>
                <td className="text-sm text-muted">{ta(a.sector)}</td>
                <td className="text-end tabular text-sm">
                  {a.currentWeight !== undefined ? `${a.currentWeight.toFixed(1)}%` : "—"}
                </td>
                <td>
                  {a.shariahCompliant ? (
                    <span className="badge-success">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="badge-danger">!</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("step2")}</h3>
            <Sliders className="w-4 h-4 text-ash-400" />
          </div>

          {/* Method */}
          <div>
            <label className="label">{t("method")}</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "p-3 rounded-xl border text-start transition",
                    method === m
                      ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                      : "border-border bg-white hover:border-madkhol-300",
                  )}
                >
                  <p className="text-sm font-medium leading-tight">{t(`method_${m}`)}</p>
                  <p className="text-[11px] text-muted mt-1 leading-tight">
                    {t(`method_${m}_hint`)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Risk slider */}
          <div>
            <label className="label">{t("riskTolerance")}</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(riskTolerance * 100)}
              onChange={(e) => setRiskTolerance(Number(e.target.value) / 100)}
              className="w-full accent-madkhol-600"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{t("riskConservative")}</span>
              <span className="tabular font-medium text-deep">
                {Math.round(riskTolerance * 100)}
              </span>
              <span>{t("riskAggressive")}</span>
            </div>
          </div>

          {/* Risk-free rate */}
          <div>
            <label className="label">{t("riskFreeRate")}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={20}
                step={0.25}
                value={Math.round(riskFreeRate * 1000) / 10}
                onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
                className="input w-28 text-end tabular py-1.5"
                dir="ltr"
              />
              <span className="text-sm text-muted">%</span>
              <p className="text-xs text-muted ms-2">{t("riskFreeHint")}</p>
            </div>
          </div>

          {/* Locked constraints */}
          <div className="space-y-2">
            <p className="label !mb-1">{t("constraints")}</p>
            <LockedRow icon={<ShieldCheck className="w-4 h-4" />} title={t("constraintShariah")} note={t("constraintShariahNote")} />
            <LockedRow icon={<Lock className="w-4 h-4" />} title={t("constraintCash")} note={t("constraintCashNote")} />
          </div>

          {/* Sector caps */}
          <ConstraintBlock title={t("constraintSectorCaps")} hint={t("constraintSectorCapsHint")}>
            <SectorCapEditor caps={sectorCaps} onChange={setSectorCaps} t={t} ta={ta} />
          </ConstraintBlock>

          {/* Per-asset bounds */}
          <ConstraintBlock title={t("constraintBounds")} hint={t("constraintBoundsHint")}>
            <PerAssetBoundsEditor
              assets={source.assets}
              bounds={perAssetBounds}
              onChange={setPerAssetBounds}
              t={t}
            />
          </ConstraintBlock>

          <button
            onClick={run}
            disabled={running || source.assets.length < 2}
            className="btn-gradient w-full"
          >
            {running ? t("running") : t("optimize")}
            <Sparkles className="w-4 h-4" />
          </button>
          {source.assets.length < 2 ? (
            <p className="text-xs text-amber-700 text-center">{t("addAssetsFirst")}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          {result ? (
            <ResultsPanel
              result={result}
              source={source}
              locale={locale}
              tweaking={tweaking}
              tweakedWeights={tweakedWeights}
              tweakValid={tweakValid}
              tweakSum={tweakSum}
              onTweakStart={() => setTweaking(true)}
              onTweakSet={(symbol, w) =>
                setTweakedWeights((prev) => ({ ...prev, [symbol]: w }))
              }
              onTweakCancel={() => {
                setTweaking(false);
                if (result) {
                  setTweakedWeights(
                    Object.fromEntries(result.weights.map((w) => [w.symbol, w.weight])),
                  );
                }
              }}
              onApply={apply}
              applyDone={applyDone}
            />
          ) : (
            <div className="card p-12 text-center text-muted text-sm bg-brand-soft border-madkhol-100">
              <Activity className="w-7 h-7 text-madkhol-700 mx-auto mb-2" />
              {locale === "ar"
                ? "اضغط على «تحسين» لعرض النتائج هنا."
                : "Click Optimize to see the results here."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Results panel
// -----------------------------------------------------------------------------

function ResultsPanel({
  result,
  source,
  locale,
  tweaking,
  tweakedWeights,
  tweakValid,
  tweakSum,
  onTweakStart,
  onTweakSet,
  onTweakCancel,
  onApply,
  applyDone,
}: {
  result: OptimizationResult;
  source: Source;
  locale: string;
  tweaking: boolean;
  tweakedWeights: Record<string, number>;
  tweakValid: boolean;
  tweakSum: number;
  onTweakStart: () => void;
  onTweakSet: (symbol: string, weight: number) => void;
  onTweakCancel: () => void;
  onApply: () => void;
  applyDone: string | null;
}) {
  const t = useTranslations("optimizer");
  const ta = useTranslations("search");

  const weights = result.weights;

  // For donut + bar charts
  const donutData = useMemo(() => {
    return [
      ...weights.map((w) => ({
        name: w.symbol,
        value: tweaking ? tweakedWeights[w.symbol] ?? w.weight : w.weight,
      })),
      { name: "Cash", value: result.cashReserveWeight },
    ];
  }, [weights, tweaking, tweakedWeights, result.cashReserveWeight]);

  const comparisonData = useMemo(() => {
    return weights.map((w) => ({
      symbol: w.symbol,
      current: w.currentWeight ?? 0,
      optimized: tweaking ? tweakedWeights[w.symbol] ?? w.weight : w.weight,
    }));
  }, [weights, tweaking, tweakedWeights]);

  const hasCurrent = weights.some((w) => w.currentWeight !== undefined);

  return (
    <div className="space-y-4">
      {/* Stat trio */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t("expectedReturn")}
          value={`${result.expectedReturnAnnualPct.toFixed(2)}%`}
          Icon={TrendingUp}
          tone="brand"
        />
        <StatTile
          label={t("expectedVol")}
          value={`${result.expectedVolatilityAnnualPct.toFixed(2)}%`}
          Icon={Activity}
          tone="neutral"
        />
        <StatTile
          label={t("sharpe")}
          value={result.sharpeRatio.toFixed(2)}
          Icon={result.sharpeRatio >= 0 ? TrendingUp : TrendingDown}
          tone={result.sharpeRatio >= 1 ? "good" : result.sharpeRatio >= 0 ? "neutral" : "warn"}
        />
      </div>

      {/* Donut + weights table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">{t("weightsTitle")}</h3>
          {!tweaking ? (
            <button onClick={onTweakStart} className="btn-outline text-xs">
              <Pencil className="w-3.5 h-3.5" />
              {t("tweakManually")}
            </button>
          ) : (
            <span
              className={cn(
                "text-xs tabular font-medium",
                tweakValid ? "text-madkhol-700" : "text-amber-700",
              )}
            >
              {t("sumPct", { n: tweakSum.toFixed(1) })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="h-[260px] min-w-0 w-full p-3">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <RPieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="white"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}%`, ""]} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-auto max-h-[260px]">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>{ta("colSector")}</th>
                  {hasCurrent ? <th className="text-end">{t("currentCol")}</th> : null}
                  <th className="text-end">{t("weightCol")}</th>
                  {hasCurrent ? <th className="text-end">{t("deltaCol")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {weights.map((w, i) => {
                  const current = w.currentWeight ?? 0;
                  const next = tweaking ? tweakedWeights[w.symbol] ?? w.weight : w.weight;
                  const delta = next - current;
                  return (
                    <tr key={w.symbol}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                          />
                          <span className="font-mono font-semibold text-deep">{w.symbol}</span>
                        </div>
                      </td>
                      <td className="text-xs text-muted">{ta(w.sector)}</td>
                      {hasCurrent ? (
                        <td className="text-end tabular text-sm">
                          {w.currentWeight !== undefined ? `${current.toFixed(1)}%` : "—"}
                        </td>
                      ) : null}
                      <td className="text-end tabular font-medium">
                        {tweaking ? (
                          <input
                            type="number"
                            min={0}
                            max={99}
                            step={0.5}
                            value={Math.round(next * 10) / 10}
                            onChange={(e) =>
                              onTweakSet(w.symbol, Number(e.target.value))
                            }
                            className="input w-20 text-end tabular py-1 px-1.5"
                            dir="ltr"
                          />
                        ) : (
                          `${next.toFixed(1)}%`
                        )}
                      </td>
                      {hasCurrent ? (
                        <td
                          className={cn(
                            "text-end tabular text-xs font-medium",
                            delta > 0.05
                              ? "text-madkhol-700"
                              : delta < -0.05
                              ? "text-red-600"
                              : "text-muted",
                          )}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)}%
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
                <tr className="bg-cream/40">
                  <td className="font-medium">Cash</td>
                  <td className="text-xs text-muted">—</td>
                  {hasCurrent ? <td className="text-end text-sm">—</td> : null}
                  <td className="text-end tabular font-medium">
                    {result.cashReserveWeight.toFixed(1)}%
                  </td>
                  {hasCurrent ? <td></td> : null}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Current vs Optimized comparison bar chart */}
      {hasCurrent ? (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">{t("comparisonTitle")}</h3>
          <div className="h-[260px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart data={comparisonData}>
                <CartesianGrid stroke="#EEF2F0" vertical={false} />
                <XAxis dataKey="symbol" stroke="#8A968F" fontSize={11} />
                <YAxis stroke="#8A968F" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="current"
                  name={locale === "ar" ? "الحالي" : "Current"}
                  fill="#D9E0DD"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="optimized"
                  name={locale === "ar" ? "المُحسَّن" : "Optimized"}
                  fill="#2BBE7E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* Warnings + diagnostics */}
      {result.warnings.length > 0 ? (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
            {t("warnings")}
          </p>
          <ul className="text-sm text-amber-900 list-disc ps-5 space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card p-3 text-xs text-muted bg-cream/40 flex flex-wrap items-center gap-2 justify-between">
        <span>
          {t("diagnosticsCounts", {
            nEligible: result.diagnostics.nEligible,
            nDroppedShariah: result.diagnostics.nDroppedShariah,
            nDroppedConstraint: result.diagnostics.nDroppedConstraint,
          })}
        </span>
        {result.diagnostics.iterations !== undefined ? (
          <span>
            {t("iterations", { n: result.diagnostics.iterations })}
            {result.diagnostics.converged !== undefined
              ? ` · ${result.diagnostics.converged ? t("converged") : t("didNotConverge")}`
              : null}
          </span>
        ) : null}
      </div>

      {/* Apply / tweak controls */}
      {applyDone ? (
        <div className="card p-5 bg-brand-soft border-madkhol-100 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-madkhol-700" />
          <p className="text-sm text-deep">{applyDone}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {tweaking ? (
            <>
              <button onClick={onTweakCancel} className="btn-outline">
                <X className="w-4 h-4" />
                {t("discardTweak")}
              </button>
              <button
                onClick={onApply}
                disabled={!tweakValid}
                className="btn-gradient"
              >
                <Save className="w-4 h-4" />
                {t("saveTweak")}
              </button>
            </>
          ) : (
            <button
              onClick={onApply}
              disabled={result.weights.length === 0}
              className="btn-gradient"
            >
              {source.kind === "model" ? (
                <>
                  <PieIcon className="w-4 h-4" />
                  {t("applyToModelBtn")}
                </>
              ) : source.kind === "client" ? (
                <>
                  <Briefcase className="w-4 h-4" />
                  {t("applyToClientBtn")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t("applyToModelBtn")}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small building blocks
// -----------------------------------------------------------------------------

function StatTile({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: typeof TrendingUp;
  tone: "brand" | "good" | "neutral" | "warn";
}) {
  return (
    <div
      className={cn(
        "card p-4",
        tone === "brand" && "bg-brand-gradient text-white border-transparent",
        tone === "good" && "bg-madkhol-50 border-madkhol-200",
        tone === "warn" && "bg-amber-50 border-amber-200",
      )}
    >
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1",
          tone === "brand" ? "text-white/80" : "text-ash-500",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-semibold tabular",
          tone === "brand" ? "text-white" : "text-deep",
          tone === "good" && "text-madkhol-700",
          tone === "warn" && "text-amber-800",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function LockedRow({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-madkhol-50/50 border border-madkhol-200">
      <span className="w-7 h-7 rounded-lg bg-madkhol-100 text-madkhol-700 grid place-items-center shrink-0 mt-0.5">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-deep">{title}</p>
        <p className="text-xs text-muted">{note}</p>
      </div>
      <Lock className="w-4 h-4 text-ash-400" />
    </div>
  );
}

function ConstraintBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-border rounded-xl p-3">
      <summary className="cursor-pointer text-sm font-medium select-none">
        {title}
      </summary>
      <p className="text-xs text-muted mt-1 mb-2">{hint}</p>
      {children}
    </details>
  );
}

function SectorCapEditor({
  caps,
  onChange,
  t,
  ta,
}: {
  caps: Partial<Record<GicsSector, number>>;
  onChange: (next: Partial<Record<GicsSector, number>>) => void;
  t: (k: string) => string;
  ta: (k: string) => string;
}) {
  const used = Object.keys(caps) as GicsSector[];
  const available = ALL_SECTORS.filter((s) => !used.includes(s));
  return (
    <div className="space-y-1.5">
      {used.map((s) => (
        <div key={s} className="flex items-center gap-2">
          <span className="badge-neutral text-xs flex-1">{ta(s)}</span>
          <input
            type="number"
            min={0}
            max={99}
            value={caps[s]}
            onChange={(e) => onChange({ ...caps, [s]: Number(e.target.value) })}
            className="input w-20 text-end tabular py-1 px-1.5"
            dir="ltr"
          />
          <span className="text-xs text-muted">%</span>
          <button
            onClick={() => {
              const next = { ...caps };
              delete next[s];
              onChange(next);
            }}
            className="text-ash-400 hover:text-red-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {available.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onChange({ ...caps, [e.target.value as GicsSector]: 30 });
          }}
          className="input py-1.5 text-sm"
        >
          <option value="">+ {t("addSectorCap")}</option>
          {available.map((s) => (
            <option key={s} value={s}>
              {ta(s)}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

function PerAssetBoundsEditor({
  assets,
  bounds,
  onChange,
  t,
}: {
  assets: OptimizerAssetInput[];
  bounds: Record<string, { min: number; max: number }>;
  onChange: (next: Record<string, { min: number; max: number }>) => void;
  t: (k: string) => string;
}) {
  const used = Object.keys(bounds);
  const available = assets.filter((a) => !used.includes(a.symbol));
  return (
    <div className="space-y-1.5">
      {used.map((symbol) => (
        <div key={symbol} className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold flex-1">{symbol}</span>
          <input
            type="number"
            min={0}
            max={99}
            value={bounds[symbol].min}
            onChange={(e) =>
              onChange({
                ...bounds,
                [symbol]: { ...bounds[symbol], min: Number(e.target.value) },
              })
            }
            className="input w-16 text-end tabular py-1 px-1.5"
            placeholder={t("min")}
            dir="ltr"
          />
          <span className="text-ash-300">–</span>
          <input
            type="number"
            min={0}
            max={99}
            value={bounds[symbol].max}
            onChange={(e) =>
              onChange({
                ...bounds,
                [symbol]: { ...bounds[symbol], max: Number(e.target.value) },
              })
            }
            className="input w-16 text-end tabular py-1 px-1.5"
            placeholder={t("max")}
            dir="ltr"
          />
          <span className="text-xs text-muted">%</span>
          <button
            onClick={() => {
              const next = { ...bounds };
              delete next[symbol];
              onChange(next);
            }}
            className="text-ash-400 hover:text-red-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {available.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onChange({ ...bounds, [e.target.value]: { min: 0, max: 30 } });
          }}
          className="input py-1.5 text-sm"
        >
          <option value="">
            <Plus className="w-3 h-3" /> + {t("addAssetBound")}
          </option>
          {available.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.symbol}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
