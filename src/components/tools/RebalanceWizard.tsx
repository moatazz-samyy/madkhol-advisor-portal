"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar, fmtUnits } from "@/lib/format";
import { WizardSteps } from "./WizardSteps";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Scale,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  executeRebalance,
  type RebalancePerClient,
  type RebalanceTrade,
} from "@/app/[locale]/(app)/rebalance/actions";

type Fund = {
  id: string;
  nameEn: string;
  nameAr: string;
  manager: string;
  assetClass: string;
  shariahCompliant: boolean;
  lastKnownNav: number;
};

type Model = {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  holdingsCount: number;
  clientsCount: number;
  targetHoldings: Record<string, number>;
};

type Client = {
  id: string;
  name: string;
  nameAr: string;
  aumSar: number;
  portfolioId: string;
  fundValues: Record<string, number>;
};

export function RebalanceWizard({
  locale,
  funds,
  models,
  clients,
  preselectedModelId,
}: {
  locale: string;
  funds: Fund[];
  models: Model[];
  clients: Client[];
  preselectedModelId: string | null;
}) {
  const t = useTranslations("rebalance");
  const router = useRouter();

  const [step, setStep] = useState(preselectedModelId ? 1 : 0);
  const [modelId, setModelId] = useState<string | null>(preselectedModelId);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState<{ jobId: string; clientCount: number; tradeCount: number } | null>(null);
  const [, startTransition] = useTransition();

  const fundsById = useMemo(() => new Map(funds.map((f) => [f.id, f])), [funds]);
  const model = models.find((m) => m.id === modelId) ?? null;

  const perClient = useMemo<{ client: Client; trades: RebalanceTrade[]; netCash: number }[]>(() => {
    if (!model) return [];
    const picked = clients.filter((c) => selectedClients.has(c.id));
    return picked.map((client) => {
      const aum = client.aumSar;
      const trades: RebalanceTrade[] = [];

      // Build full universe of fund ids we need to touch: target ∪ current
      const fundIds = new Set([
        ...Object.keys(model.targetHoldings),
        ...Object.keys(client.fundValues),
      ]);

      for (const fundId of fundIds) {
        const targetPct = model.targetHoldings[fundId] ?? 0;
        const targetValue = (targetPct / 100) * aum;
        const currentValue = client.fundValues[fundId] ?? 0;
        const delta = targetValue - currentValue;
        if (Math.abs(delta) < aum * 0.005) continue; // ignore <0.5% AuM drift
        const fund = fundsById.get(fundId);
        if (!fund) continue;
        const amount = Math.round(Math.abs(delta));
        const units = +(amount / fund.lastKnownNav).toFixed(4);
        trades.push({
          fundId,
          type: delta > 0 ? "buy" : "sell",
          units,
          amountSar: amount,
        });
      }
      const netCash = trades.reduce(
        (s, tr) => s + (tr.type === "buy" ? -tr.amountSar : tr.amountSar),
        0,
      );
      return { client, trades, netCash };
    });
  }, [model, clients, selectedClients, fundsById]);

  const totalTrades = perClient.reduce((s, p) => s + p.trades.length, 0);
  const buyTotal = perClient.reduce(
    (s, p) => s + p.trades.filter((tr) => tr.type === "buy").reduce((ss, tr) => ss + tr.amountSar, 0),
    0,
  );
  const sellTotal = perClient.reduce(
    (s, p) => s + p.trades.filter((tr) => tr.type === "sell").reduce((ss, tr) => ss + tr.amountSar, 0),
    0,
  );

  const STEPS = [
    { key: "model", label: t("step1") },
    { key: "clients", label: t("step2") },
    { key: "preview", label: t("step3") },
    { key: "confirm", label: t("step4") },
  ];

  function next() {
    if (step === 0 && !modelId) return;
    if (step === 1 && selectedClients.size === 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function confirm() {
    if (!model) return;
    setExecuting(true);
    try {
      const input: RebalancePerClient[] = perClient
        .filter((p) => p.trades.length > 0)
        .map((p) => ({ clientId: p.client.id, trades: p.trades }));
      const result = await executeRebalance({ modelId: model.id, perClient: input });
      setSuccess(result);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    } finally {
      setExecuting(false);
    }
  }

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
            {t("successMessage", { c: success.clientCount, n: success.tradeCount })}
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Link href={`/${locale}/clients`} className="btn-outline">
              {locale === "ar" ? "عرض العملاء" : "View clients"}
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setStep(0);
                setModelId(null);
                setSelectedClients(new Set());
              }}
              className="btn-gradient"
            >
              <Sparkles className="w-4 h-4" />
              {locale === "ar" ? "إعادة موازنة جديدة" : "New rebalance"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No models exist yet
  if (models.length === 0 && step === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </header>
        <div className="card p-12 text-center bg-brand-soft border-madkhol-100">
          <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center text-madkhol-700 shadow-card mx-auto mb-4">
            <Scale className="w-6 h-6" />
          </div>
          <p className="text-deep font-medium mb-4">{t("noModels")}</p>
          <Link href={`/${locale}/models`} className="btn-gradient">
            {t("createFirst")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      <WizardSteps steps={STEPS} active={step} />

      <div className="card p-6">
        {step === 0 ? (
          <ModelPicker
            models={models}
            value={modelId}
            onChange={setModelId}
            locale={locale}
          />
        ) : null}
        {step === 1 ? (
          <ClientsForRebalance
            clients={clients}
            value={selectedClients}
            onChange={setSelectedClients}
            locale={locale}
          />
        ) : null}
        {step === 2 ? (
          <RebalancePreview
            perClient={perClient}
            fundsById={fundsById}
            locale={locale}
          />
        ) : null}
        {step === 3 ? (
          <RebalanceConfirm
            model={model}
            totalTrades={totalTrades}
            buyTotal={buyTotal}
            sellTotal={sellTotal}
            clientCount={selectedClients.size}
            locale={locale}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={step === 0}
          className={cn("btn-outline", step === 0 && "opacity-0 pointer-events-none")}
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          {locale === "ar" ? "السابق" : "Back"}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={(step === 0 && !modelId) || (step === 1 && selectedClients.size === 0)}
            className="btn-gradient"
          >
            {locale === "ar" ? "التالي" : "Next"}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        ) : (
          <button
            onClick={confirm}
            disabled={executing || totalTrades === 0}
            className="btn-gradient"
          >
            {executing ? (locale === "ar" ? "جاري التنفيذ…" : "Executing…") : (locale === "ar" ? "تأكيد التنفيذ" : "Confirm execution")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Step 1: Model picker ----

function ModelPicker({
  models,
  value,
  onChange,
  locale,
}: {
  models: Model[];
  value: string | null;
  onChange: (v: string) => void;
  locale: string;
}) {
  const t = useTranslations("rebalance");
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("pickModel")}</h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {models.map((m) => {
          const selected = value === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onChange(m.id)}
                className={cn(
                  "w-full text-start p-4 rounded-xl border transition",
                  selected
                    ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                    : "border-border bg-white hover:border-madkhol-300",
                )}
              >
                <p className="font-semibold">{locale === "ar" ? m.nameAr : m.name}</p>
                <p className="text-xs text-muted mt-1 line-clamp-2">{m.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="badge-neutral">
                    {m.holdingsCount}{" "}
                    {locale === "ar" ? "صناديق" : "funds"}
                  </span>
                  <span className="text-muted">
                    {m.clientsCount}{" "}
                    {locale === "ar" ? "عميل" : "clients using"}
                  </span>
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

function ClientsForRebalance({
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
  const t = useTranslations("rebalance");
  function toggle(id: string) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-lg">{t("step2")}</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs" onClick={() => onChange(new Set(clients.map((c) => c.id)))}>
            {locale === "ar" ? "اختيار الكل" : "Select all"}
          </button>
          <button className="btn-ghost text-xs" onClick={() => onChange(new Set())}>
            {locale === "ar" ? "إلغاء الكل" : "Clear all"}
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pe-1">
        {clients.map((c) => {
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {locale === "ar" ? c.nameAr : c.name}
                  </p>
                  <p className="text-xs text-muted tabular">{fmtSar(c.aumSar)} SAR</p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Step 3: Preview ----

function RebalancePreview({
  perClient,
  fundsById,
  locale,
}: {
  perClient: { client: Client; trades: RebalanceTrade[]; netCash: number }[];
  fundsById: Map<string, Fund>;
  locale: string;
}) {
  const t = useTranslations("rebalance");
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">{t("step3")}</h2>
      {perClient.map(({ client, trades, netCash }) => (
        <div key={client.id} className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-medium">
                {locale === "ar" ? client.nameAr : client.name}
              </p>
              <p className="text-xs text-muted tabular">
                AuM: {fmtSar(client.aumSar)} SAR
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="badge-neutral">
                {t("tradesCount", { n: trades.length })}
              </span>
              <span
                className={cn(
                  "tabular font-medium",
                  netCash >= 0 ? "text-madkhol-700" : "text-red-600",
                )}
              >
                {t("cashImpact")}: {netCash >= 0 ? "+" : ""}
                {fmtSar(netCash)}
              </span>
            </div>
          </div>
          {trades.length === 0 ? (
            <p className="text-sm text-muted px-5 py-6 text-center">{t("noChanges")}</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>{locale === "ar" ? "النوع" : "Type"}</th>
                  <th>{locale === "ar" ? "الصندوق" : "Fund"}</th>
                  <th className="text-end">{locale === "ar" ? "الوحدات" : "Units"}</th>
                  <th className="text-end">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((tr, i) => {
                  const fund = fundsById.get(tr.fundId);
                  const Icon = tr.type === "buy" ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <tr key={i}>
                      <td>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                            tr.type === "buy"
                              ? "bg-madkhol-50 text-madkhol-700"
                              : "bg-ash-100 text-ash-600",
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {tr.type === "buy"
                            ? locale === "ar" ? "شراء" : "Buy"
                            : locale === "ar" ? "بيع" : "Sell"}
                        </span>
                      </td>
                      <td>
                        {fund
                          ? locale === "ar" ? fund.nameAr : fund.nameEn
                          : "—"}
                      </td>
                      <td className="text-end tabular">{fmtUnits(tr.units)}</td>
                      <td className="text-end tabular font-medium">
                        {fmtSar(tr.amountSar)}{" "}
                        <span className="text-xs text-muted font-normal">SAR</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Step 4: Confirm ----

function RebalanceConfirm({
  model,
  totalTrades,
  buyTotal,
  sellTotal,
  clientCount,
  locale,
}: {
  model: Model | null;
  totalTrades: number;
  buyTotal: number;
  sellTotal: number;
  clientCount: number;
  locale: string;
}) {
  const t = useTranslations("rebalance");
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">{t("step4")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={t("pickModel")}>
          {model ? (locale === "ar" ? model.nameAr : model.name) : "—"}
        </Stat>
        <Stat label={locale === "ar" ? "العملاء" : "Clients"}>
          {clientCount}
        </Stat>
        <Stat label={t("tradesRequired")}>{totalTrades}</Stat>
        <Stat label={t("buyTotal")} tone="positive">
          {fmtSar(buyTotal)} SAR
        </Stat>
        <Stat label={t("sellTotal")} tone="negative">
          {fmtSar(sellTotal)} SAR
        </Stat>
      </div>
    </div>
  );
}

function Stat({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-semibold tabular",
          tone === "positive" && "text-madkhol-700",
          tone === "negative" && "text-red-600",
        )}
      >
        {children}
      </p>
    </div>
  );
}
