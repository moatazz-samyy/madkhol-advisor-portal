"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar, fmtPct, fmtUnits } from "@/lib/format";
import { WizardSteps } from "./WizardSteps";
import {
  Search,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  executeAllocation,
  type AllocationBreakdown,
} from "@/app/[locale]/(app)/allocation/actions";

type Fund = {
  id: string;
  nameEn: string;
  nameAr: string;
  manager: string;
  assetClass: string;
  shariahCompliant: boolean;
  shariahStatusReason: string | null;
  lastKnownNav: number;
  ytdReturn: number;
};

type Client = {
  id: string;
  name: string;
  nameAr: string;
  aumSar: number;
  holdingsCount: number;
  portfolioId: string;
  fundValues: Record<string, number>;
};

type Algorithm = "pro_rata_aum" | "pro_rata_target" | "equal_sar";

export function AllocationWizard({
  locale,
  funds,
  clients,
}: {
  locale: string;
  funds: Fund[];
  clients: Client[];
}) {
  const t = useTranslations("allocation");
  const ta = useTranslations("asset");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [fundId, setFundId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [algorithm, setAlgorithm] = useState<Algorithm>("pro_rata_aum");
  const [totalAmount, setTotalAmount] = useState<number>(500_000);
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string; count: number } | null>(null);
  const [, startTransition] = useTransition();

  const fund = funds.find((f) => f.id === fundId) ?? null;

  const breakdown = useMemo<AllocationBreakdown[]>(() => {
    if (!fund || selectedClients.size === 0 || totalAmount <= 0) return [];
    const picked = clients.filter((c) => selectedClients.has(c.id));
    let weights: number[] = [];
    if (algorithm === "pro_rata_aum") {
      const totalAum = picked.reduce((s, c) => s + c.aumSar, 0);
      weights = picked.map((c) => (totalAum > 0 ? c.aumSar / totalAum : 1 / picked.length));
    } else if (algorithm === "equal_sar") {
      weights = picked.map(() => 1 / picked.length);
    } else {
      // pro_rata_target — approximate: clients holding the fund get proportional to existing
      // exposure; clients without get an equal slice of the remainder.
      const withFund = picked.filter((c) => c.fundValues[fund.id] !== undefined);
      const withoutFund = picked.filter((c) => c.fundValues[fund.id] === undefined);
      const exposureTotal = withFund.reduce(
        (s, c) => s + (c.fundValues[fund.id] ?? 0),
        0,
      );
      const exposureShare = exposureTotal > 0 ? 0.7 : 0;
      const remainderShare = 1 - exposureShare;
      weights = picked.map((c) => {
        if (withFund.includes(c)) {
          return exposureShare * ((c.fundValues[fund.id] ?? 0) / Math.max(exposureTotal, 1));
        }
        return withoutFund.length > 0 ? remainderShare / withoutFund.length : 0;
      });
    }
    return picked.map((c, i) => {
      const amount = Math.round(totalAmount * weights[i]);
      const units = +(amount / fund.lastKnownNav).toFixed(4);
      const newAum = c.aumSar + amount;
      const existing = c.fundValues[fund.id] ?? 0;
      const resultingWeight = newAum > 0 ? ((existing + amount) / newAum) * 100 : 0;
      return { clientId: c.id, amountSar: amount, units, resultingWeight };
    });
  }, [fund, clients, selectedClients, algorithm, totalAmount]);

  const shariahMismatches = useMemo(() => {
    if (!fund || fund.shariahCompliant) return 0;
    // For demo: assume EVERY client prefers compliant. Real product would gate by client profile.
    return selectedClients.size;
  }, [fund, selectedClients]);

  const STEPS = [
    { key: "fund", label: t("step1") },
    { key: "clients", label: t("step2") },
    { key: "algo", label: t("step3") },
    { key: "amount", label: t("step4") },
    { key: "preview", label: t("step5") },
    { key: "confirm", label: t("step6") },
  ];

  if (success) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        </header>
        <div className="card p-10 bg-brand-soft border-madkhol-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center text-madkhol-700 shadow-card mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("successTitle")}</h2>
          <p className="text-muted mb-6">
            {t("successMessage", { n: success.count, c: success.count })}
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Link href={`/${locale}/clients`} className="btn-outline">
              {t("viewClients")}
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setStep(0);
                setFundId(null);
                setSelectedClients(new Set());
                setTotalAmount(500_000);
              }}
              className="btn-gradient"
            >
              <Sparkles className="w-4 h-4" />
              {t("newOrder")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function next() {
    if (step === 0 && !fundId) return;
    if (step === 1 && selectedClients.size === 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function confirm() {
    if (!fund) return;
    setExecuting(true);
    try {
      const result = await executeAllocation({
        fundId: fund.id,
        algorithm,
        totalAmountSar: totalAmount,
        breakdown,
      });
      setSuccess({ orderId: result.orderId, count: result.transactionCount });
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      <WizardSteps steps={STEPS} active={step} />

      {/* Step body */}
      <div className="card p-6">
        {step === 0 ? (
          <FundPicker
            funds={funds}
            value={fundId}
            onChange={setFundId}
            locale={locale}
            ta={ta}
          />
        ) : null}
        {step === 1 ? (
          <ClientPicker
            clients={clients}
            value={selectedClients}
            onChange={setSelectedClients}
            locale={locale}
          />
        ) : null}
        {step === 2 ? (
          <AlgoPicker value={algorithm} onChange={setAlgorithm} />
        ) : null}
        {step === 3 ? (
          <AmountInput
            value={totalAmount}
            onChange={setTotalAmount}
            clientCount={selectedClients.size}
          />
        ) : null}
        {step === 4 ? (
          <PreviewTable
            breakdown={breakdown}
            clients={clients}
            locale={locale}
            shariahMismatches={shariahMismatches}
            fundCompliant={fund?.shariahCompliant ?? true}
          />
        ) : null}
        {step === 5 ? (
          <ConfirmCard
            fund={fund}
            algorithm={algorithm}
            totalAmount={totalAmount}
            breakdown={breakdown}
            locale={locale}
          />
        ) : null}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={step === 0}
          className={cn(
            "btn-outline",
            step === 0 && "opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          {t("back")}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={
              (step === 0 && !fundId) ||
              (step === 1 && selectedClients.size === 0) ||
              (step === 3 && totalAmount < 10_000)
            }
            className="btn-gradient"
          >
            {t("next")}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        ) : (
          <button onClick={confirm} disabled={executing} className="btn-gradient">
            {executing ? t("executing") : t("confirm")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Step 1: Fund picker ----

function FundPicker({
  funds,
  value,
  onChange,
  locale,
  ta,
}: {
  funds: Fund[];
  value: string | null;
  onChange: (v: string) => void;
  locale: string;
  ta: (key: string) => string;
}) {
  const t = useTranslations("allocation");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return funds.slice(0, 30);
    return funds
      .filter(
        (f) =>
          f.nameEn.toLowerCase().includes(needle) ||
          f.nameAr.includes(q.trim()) ||
          f.manager.toLowerCase().includes(needle),
      )
      .slice(0, 30);
  }, [q, funds]);

  return (
    <div>
      <h2 className="font-semibold text-lg mb-1">{t("step1")}</h2>
      <p className="text-sm text-muted mb-4">
        {locale === "ar"
          ? "ابحث في الكون الاستثماري المعتمد."
          : "Search the curated investable universe."}
      </p>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={locale === "ar" ? "ابحث باسم الصندوق أو المدير…" : "Search by fund or manager…"}
          className="input ps-9"
        />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pe-1">
        {filtered.map((f) => {
          const selected = value === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onChange(f.id)}
                className={cn(
                  "w-full text-start p-3.5 rounded-xl border transition flex items-start gap-3",
                  selected
                    ? "border-madkhol-500 bg-madkhol-50/50 shadow-ring"
                    : "border-border bg-white hover:border-madkhol-300",
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-xl grid place-items-center shrink-0",
                    f.shariahCompliant
                      ? "bg-madkhol-50 text-madkhol-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {f.shariahCompliant ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <ShieldX className="w-4 h-4" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {locale === "ar" ? f.nameAr : f.nameEn}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted truncate">{f.manager}</span>
                    <span className="text-xs text-ash-300">·</span>
                    <span className="badge-neutral text-[10px]">{ta(f.assetClass)}</span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs text-muted">NAV</p>
                  <p className="text-sm font-medium tabular">
                    {f.lastKnownNav.toFixed(2)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] tabular flex items-center gap-0.5 justify-end",
                      f.ytdReturn >= 0 ? "text-madkhol-700" : "text-red-600",
                    )}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {fmtPct(f.ytdReturn)}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Step 2: Clients picker ----

function ClientPicker({
  clients,
  value,
  onChange,
  locale,
}: {
  clients: Client[];
  value: Set<string>;
  onChange: (v: Set<string>) => void;
  locale: string;
}) {
  const t = useTranslations("allocation");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.nameAr.includes(q.trim()),
    );
  }, [q, clients]);

  function toggle(id: string) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg mb-1">{t("step2")}</h2>
          <p className="text-sm text-muted">{t("selectedCount", { n: value.size })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => onChange(new Set(filtered.map((c) => c.id)))}
          >
            {t("selectAll")}
          </button>
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => onChange(new Set())}
          >
            {t("clearAll")}
          </button>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={locale === "ar" ? "ابحث بالاسم…" : "Search by name…"}
          className="input ps-9"
        />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pe-1">
        {filtered.map((c) => {
          const checked = value.has(c.id);
          return (
            <li key={c.id}>
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition",
                  checked
                    ? "border-madkhol-500 bg-madkhol-50/40"
                    : "border-border bg-white hover:border-madkhol-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4 accent-madkhol-600"
                />
                <span className="w-9 h-9 rounded-full bg-ash-100 text-ash-600 grid place-items-center text-xs font-semibold shrink-0">
                  {(locale === "ar" ? c.nameAr : c.name)
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {locale === "ar" ? c.nameAr : c.name}
                  </p>
                  <p className="text-xs text-muted">
                    {fmtSar(c.aumSar)} SAR · {c.holdingsCount}{" "}
                    {locale === "ar" ? "صندوق" : "funds"}
                  </p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Step 3: Algorithm picker ----

function AlgoPicker({
  value,
  onChange,
}: {
  value: Algorithm;
  onChange: (v: Algorithm) => void;
}) {
  const t = useTranslations("allocation");
  const options: { value: Algorithm; label: string; desc: string }[] = [
    { value: "pro_rata_aum", label: t("algoProRataAum"), desc: t("algoProRataAumDesc") },
    { value: "pro_rata_target", label: t("algoProRataTarget"), desc: t("algoProRataTargetDesc") },
    { value: "equal_sar", label: t("algoEqual"), desc: t("algoEqualDesc") },
  ];
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("step3")}</h2>
      <ul className="space-y-2.5">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <li key={o.value}>
              <label
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition",
                  selected
                    ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                    : "border-border bg-white hover:border-madkhol-300",
                )}
              >
                <input
                  type="radio"
                  name="algo"
                  checked={selected}
                  onChange={() => onChange(o.value)}
                  className="w-4 h-4 mt-0.5 accent-madkhol-600"
                />
                <div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-muted mt-0.5">{o.desc}</p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Step 4: Amount input ----

function AmountInput({
  value,
  onChange,
  clientCount,
}: {
  value: number;
  onChange: (v: number) => void;
  clientCount: number;
}) {
  const t = useTranslations("allocation");
  const presets = [100_000, 500_000, 1_000_000, 2_500_000, 5_000_000];
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("step4")}</h2>
      <label className="label">{t("totalAmount")}</label>
      <input
        type="number"
        min={10_000}
        max={10_000_000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input text-3xl font-semibold tabular py-4"
        dir="ltr"
      />
      <p className="text-xs text-muted mt-2">{t("totalAmountHint")}</p>
      <div className="flex gap-2 mt-4 flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
              value === p
                ? "border-madkhol-500 bg-madkhol-50 text-madkhol-700"
                : "border-border text-ash-500 hover:border-madkhol-300",
            )}
          >
            {fmtSar(p)} SAR
          </button>
        ))}
      </div>
      {clientCount > 0 ? (
        <p className="text-sm text-muted mt-4 tabular">
          ≈ {fmtSar(Math.round(value / clientCount))} SAR / client
        </p>
      ) : null}
    </div>
  );
}

// ---- Step 5: Preview ----

function PreviewTable({
  breakdown,
  clients,
  locale,
  shariahMismatches,
  fundCompliant,
}: {
  breakdown: AllocationBreakdown[];
  clients: Client[];
  locale: string;
  shariahMismatches: number;
  fundCompliant: boolean;
}) {
  const t = useTranslations("allocation");
  const byId = new Map(clients.map((c) => [c.id, c]));
  const total = breakdown.reduce((s, r) => s + r.amountSar, 0);

  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("step5")}</h2>

      {!fundCompliant ? (
        <div className="card p-4 mb-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <CircleAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {t("shariahWarning", { n: shariahMismatches })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("previewClient")}</th>
              <th className="text-end">{t("previewAmount")}</th>
              <th className="text-end">{t("previewUnits")}</th>
              <th className="text-end">{t("previewResultingWeight")}</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => {
              const c = byId.get(row.clientId);
              if (!c) return null;
              return (
                <tr key={row.clientId}>
                  <td>{locale === "ar" ? c.nameAr : c.name}</td>
                  <td className="text-end tabular font-medium">
                    {fmtSar(row.amountSar)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                  <td className="text-end tabular">{fmtUnits(row.units)}</td>
                  <td className="text-end tabular">{row.resultingWeight.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="bg-ash-50/60 font-semibold">
              <td>{locale === "ar" ? "الإجمالي" : "Total"}</td>
              <td className="text-end tabular">
                {fmtSar(total)} <span className="text-xs text-muted font-normal">SAR</span>
              </td>
              <td className="text-end tabular">—</td>
              <td className="text-end">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Step 6: Confirm ----

function ConfirmCard({
  fund,
  algorithm,
  totalAmount,
  breakdown,
  locale,
}: {
  fund: Fund | null;
  algorithm: Algorithm;
  totalAmount: number;
  breakdown: AllocationBreakdown[];
  locale: string;
}) {
  const t = useTranslations("allocation");
  const algoLabel = {
    pro_rata_aum: t("algoProRataAum"),
    pro_rata_target: t("algoProRataTarget"),
    equal_sar: t("algoEqual"),
  }[algorithm];

  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("step6")}</h2>
      <ul className="space-y-3">
        <Row label={t("step1")}>
          {fund ? (locale === "ar" ? fund.nameAr : fund.nameEn) : "—"}
        </Row>
        <Row label={t("step2")}>{breakdown.length}</Row>
        <Row label={t("step3")}>{algoLabel}</Row>
        <Row label={t("step4")}>
          <span className="font-semibold tabular">
            {fmtSar(totalAmount)} <span className="text-xs text-muted font-normal">SAR</span>
          </span>
        </Row>
      </ul>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm">{children}</span>
    </li>
  );
}
