"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import {
  CalendarHeart,
  UserCircle2,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

type ClientBrief = {
  id: string;
  name: string;
  nameAr: string;
  aumSar: number;
  monthlyExpenseSar: number;
  expectedRetireAge: number;
};

const ANNUAL_RETURN = 0.06;
const INFLATION = 0.025;
const GOSI_REPLACEMENT_RATE = 0.4; // 40% of average salary, simplified

export function GosiPlanner({
  locale,
  clients,
  preselectedClientId,
}: {
  locale: string;
  clients: ClientBrief[];
  preselectedClientId: string | null;
}) {
  const t = useTranslations("gosi");
  const [clientId, setClientId] = useState<string | null>(
    preselectedClientId ?? clients[0]?.id ?? null,
  );
  const selected = clients.find((c) => c.id === clientId);

  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(selected?.expectedRetireAge ?? 60);
  const [monthlyExpense, setMonthlyExpense] = useState(
    selected?.monthlyExpenseSar ?? 15000,
  );
  const [monthlySalary, setMonthlySalary] = useState(25000);

  function switchClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setRetireAge(c.expectedRetireAge);
    setMonthlyExpense(c.monthlyExpenseSar);
  }

  const yearsLeft = Math.max(0, retireAge - currentAge);

  // Inflate expense at retirement
  const inflatedExpense = monthlyExpense * Math.pow(1 + INFLATION, yearsLeft);
  // GOSI pension: ~40% of an inflated salary
  const inflatedSalary = monthlySalary * Math.pow(1 + INFLATION, yearsLeft);
  const gosiPension = inflatedSalary * GOSI_REPLACEMENT_RATE;
  const monthlyGap = Math.max(0, inflatedExpense - gosiPension);
  const annualGap = monthlyGap * 12;
  // Required corpus to generate the gap at 4% safe withdrawal
  const requiredCorpus = annualGap / 0.04;
  // Current trajectory: grow current AuM at 6%
  const projectedAum = (selected?.aumSar ?? 0) * Math.pow(1 + ANNUAL_RETURN, yearsLeft);
  const corpusGap = Math.max(0, requiredCorpus - projectedAum);
  // PMT-style: monthly contribution needed to fill the gap, simplified to nominal terms
  const months = Math.max(1, yearsLeft * 12);
  const monthlyRate = ANNUAL_RETURN / 12;
  const suggestedContribution =
    corpusGap > 0
      ? (corpusGap * monthlyRate) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : 0;

  const data = useMemo(() => {
    return Array.from({ length: yearsLeft + 1 }, (_, i) => {
      const age = currentAge + i;
      const salaryAtAge = monthlySalary * Math.pow(1 + INFLATION, i);
      const expenseAtAge = monthlyExpense * Math.pow(1 + INFLATION, i);
      const pension = i === yearsLeft ? salaryAtAge * GOSI_REPLACEMENT_RATE : null;
      return {
        age,
        expense: Math.round(expenseAtAge),
        salary: Math.round(salaryAtAge),
        gosi: pension ? Math.round(pension) : null,
      };
    });
  }, [currentAge, yearsLeft, monthlySalary, monthlyExpense]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      {/* Client picker */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <UserCircle2 className="w-5 h-5 text-ash-400" />
        <select
          value={clientId ?? ""}
          onChange={(e) => switchClient(e.target.value)}
          className="input w-auto py-2 text-sm flex-1 max-w-md"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {locale === "ar" ? c.nameAr : c.name} —{" "}
              {fmtSar(c.aumSar)} SAR
            </option>
          ))}
        </select>
        <div className="ms-auto text-sm">
          <span className="text-muted">{t("currentPortfolio")}: </span>
          <span className="font-semibold tabular">
            {fmtSar(selected?.aumSar ?? 0)} SAR
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <section className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">{t("inputs")}</h3>
          <NumInput label={t("currentAge")} value={currentAge} onChange={setCurrentAge} min={20} max={80} />
          <NumInput label={t("retireAge")} value={retireAge} onChange={setRetireAge} min={currentAge + 1} max={75} />
          <NumInput
            label={t("monthlyExpense")}
            value={monthlyExpense}
            onChange={setMonthlyExpense}
            min={0}
            max={200000}
            step={500}
          />
          <NumInput
            label={t("monthlySalary")}
            value={monthlySalary}
            onChange={setMonthlySalary}
            min={0}
            max={200000}
            step={500}
          />

          <p className="text-xs text-muted bg-cream/60 border border-border p-3 rounded-xl flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-ash-400 mt-0.5 shrink-0" />
            {t("assumeReturn")}
          </p>
        </section>

        {/* Results */}
        <section className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultCard
              label={t("gosiPension")}
              value={fmtSar(gosiPension)}
              suffix="SAR"
              Icon={CalendarHeart}
              tone="brand"
            />
            <ResultCard
              label={t("monthlyGap")}
              value={fmtSar(monthlyGap)}
              suffix="SAR"
              Icon={TrendingDown}
              tone={monthlyGap > 0 ? "warn" : "good"}
            />
            <ResultCard
              label={t("requiredCorpus")}
              value={fmtSar(requiredCorpus)}
              suffix="SAR"
              Icon={TrendingUp}
            />
            <ResultCard
              label={t("suggestedContribution")}
              value={fmtSar(suggestedContribution)}
              suffix="SAR / mo"
              Icon={TrendingUp}
              tone={suggestedContribution > 0 ? "warn" : "good"}
            />
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-1">{t("projectionTitle")}</h3>
            <p className="text-xs text-muted mb-3">
              {t("yearsLeft", { n: yearsLeft })} · {t("atRetirement")} →{" "}
              <span className="font-semibold tabular text-deep">
                {fmtSar(gosiPension)} SAR
              </span>
            </p>
            <div className="h-[280px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#EEF2F0" vertical={false} />
                  <XAxis
                    dataKey="age"
                    stroke="#8A968F"
                    fontSize={11}
                    reversed={locale === "ar"}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    orientation={locale === "ar" ? "right" : "left"}
                    stroke="#8A968F"
                    fontSize={11}
                    tickFormatter={(v) => fmtSar(v as number)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E7ECE9",
                      fontSize: 12,
                    }}
                    formatter={(v, key) => [`${fmtSar(Number(v))} SAR`, String(key)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name={locale === "ar" ? "النفقات" : "Expenses"}
                    stroke="#D97706"
                    fill="#FCD34D"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="salary"
                    name={locale === "ar" ? "الراتب" : "Salary"}
                    stroke="#5E6964"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="gosi"
                    name={locale === "ar" ? "راتب التأمينات" : "GOSI pension"}
                    stroke="#2BBE7E"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#2BBE7E" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input tabular text-end"
        dir="ltr"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  suffix,
  Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  suffix?: string;
  Icon: typeof CalendarHeart;
  tone?: "brand" | "good" | "warn" | "neutral";
}) {
  return (
    <div
      className={cn(
        "card p-4 relative overflow-hidden",
        tone === "brand" && "bg-brand-gradient text-white border-transparent",
        tone === "good" && "bg-madkhol-50 border-madkhol-200",
        tone === "warn" && "bg-amber-50 border-amber-200",
      )}
    >
      <div
        className={cn(
          "text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5",
          tone === "brand" ? "text-white/80" : "text-ash-500",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p
        className={cn(
          "text-xl font-semibold tabular mt-1",
          tone === "brand" && "text-white",
          tone === "good" && "text-madkhol-700",
          tone === "warn" && "text-amber-800",
        )}
      >
        {value}{" "}
        {suffix ? (
          <span
            className={cn(
              "text-xs font-normal",
              tone === "brand" ? "text-white/70" : "text-muted",
            )}
          >
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}
