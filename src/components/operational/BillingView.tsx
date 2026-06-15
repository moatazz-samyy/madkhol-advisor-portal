"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

type Client = { id: string; name: string; nameAr: string; aumSar: number };

type FeeStructureKey = "aum" | "flat" | "hybrid";

const STRUCTURES: {
  key: FeeStructureKey;
  monthlyForAum: (aumSar: number) => number;
}[] = [
  { key: "aum", monthlyForAum: (aum) => (aum * 0.01) / 12 }, // 1% annual / 12
  { key: "flat", monthlyForAum: () => 2_500 }, // SAR 2,500 / month
  {
    key: "hybrid",
    monthlyForAum: (aum) => 1_500 + Math.max(0, aum - 500_000) * 0.005 / 12,
  },
];

// Round-robin assignment of fee structures across clients for the demo.
function assignStructure(i: number): FeeStructureKey {
  return (["aum", "aum", "aum", "flat", "hybrid"] as FeeStructureKey[])[i % 5];
}

const MONTHS_OF_HISTORY = 4;

export function BillingView({
  locale,
  clients,
}: {
  locale: string;
  clients: Client[];
}) {
  const t = useTranslations("billing");

  const assignments = useMemo(
    () =>
      clients.map((c, i) => ({
        client: c,
        structureKey: assignStructure(i),
      })),
    [clients],
  );

  const monthlyTotals = useMemo(() => {
    return assignments.map((a) => {
      const def = STRUCTURES.find((s) => s.key === a.structureKey)!;
      return { ...a, monthlyFee: def.monthlyForAum(a.client.aumSar) };
    });
  }, [assignments]);

  const totalThisMonth = monthlyTotals.reduce((s, a) => s + a.monthlyFee, 0);

  // Generate the last N months of invoices with status round-robin
  const invoices = useMemo(() => {
    const out: {
      id: string;
      monthLabel: string;
      amount: number;
      status: "paid" | "pending" | "overdue";
      clientCount: number;
    }[] = [];
    const monthNames = [
      ["يناير", "Jan"], ["فبراير", "Feb"], ["مارس", "Mar"], ["أبريل", "Apr"],
      ["مايو", "May"], ["يونيو", "Jun"], ["يوليو", "Jul"], ["أغسطس", "Aug"],
      ["سبتمبر", "Sep"], ["أكتوبر", "Oct"], ["نوفمبر", "Nov"], ["ديسمبر", "Dec"],
    ];
    const now = new Date(2026, 5, 9);
    for (let i = 0; i < MONTHS_OF_HISTORY; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const status: "paid" | "pending" | "overdue" =
        i === 0 ? "pending" : i === 1 ? "overdue" : "paid";
      out.push({
        id: `inv-${d.getFullYear()}-${d.getMonth() + 1}`,
        monthLabel: `${monthNames[d.getMonth()][locale === "ar" ? 0 : 1]} ${d.getFullYear()}`,
        amount: totalThisMonth * (0.95 + Math.sin(i) * 0.05),
        status,
        clientCount: clients.length,
      });
    }
    return out;
  }, [clients.length, totalThisMonth, locale]);

  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
      </header>

      {/* Top stat row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat
          label={t("totalThisMonth")}
          value={fmtSar(totalThisMonth)}
          suffix="SAR"
          tone="brand"
          Icon={Wallet}
        />
        <Stat
          label={t("totalCollected")}
          value={fmtSar(totalCollected)}
          suffix="SAR"
          tone="good"
          Icon={CheckCircle2}
        />
        <Stat
          label={t("totalOverdue")}
          value={fmtSar(totalOverdue)}
          suffix="SAR"
          tone={totalOverdue > 0 ? "warn" : "neutral"}
          Icon={AlertCircle}
        />
      </section>

      {/* Fee structures */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">{t("feeStructures")}</h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {STRUCTURES.map((s) => (
            <li key={s.key} className="bg-white p-5">
              <p className="text-sm font-semibold">{t(`fee_${s.key}`)}</p>
              <p className="text-xs text-muted mt-1">{t(`fee_${s.key}_desc`)}</p>
              <p className="text-xs font-medium tabular text-deep mt-3">
                {s.key === "aum" ? "1.00% AuM / year" : null}
                {s.key === "flat" ? "SAR 2,500 / month" : null}
                {s.key === "hybrid" ? "SAR 1,500 + 0.50% above 500k" : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Per-client assignment */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">{t("assignFees")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("client")}</th>
                <th>{t("structure")}</th>
                <th className="text-end">AuM</th>
                <th className="text-end">{t("monthlyFee")}</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((a) => (
                <tr key={a.client.id}>
                  <td className="font-medium">
                    {locale === "ar" ? a.client.nameAr : a.client.name}
                  </td>
                  <td>
                    <span className="badge-neutral text-xs">
                      {t(`fee_${a.structureKey}`)}
                    </span>
                  </td>
                  <td className="text-end tabular">
                    {fmtSar(a.client.aumSar)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                  <td className="text-end tabular font-semibold">
                    {fmtSar(a.monthlyFee)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoices */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">{t("invoicesTitle")}</h3>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("month")}</th>
              <th className="text-end">{t("client")}</th>
              <th className="text-end">{t("amount")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium">{inv.monthLabel}</td>
                <td className="text-end tabular">{inv.clientCount}</td>
                <td className="text-end tabular font-semibold">
                  {fmtSar(inv.amount)}{" "}
                  <span className="text-xs text-muted font-normal">SAR</span>
                </td>
                <td>
                  <StatusBadge status={inv.status} t={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: "brand" | "good" | "warn" | "neutral";
  Icon: typeof Wallet;
}) {
  return (
    <div
      className={cn(
        "card p-5 relative overflow-hidden",
        tone === "brand" && "bg-brand-gradient text-white border-transparent",
        tone === "good" && "bg-madkhol-50 border-madkhol-200",
        tone === "warn" && "bg-amber-50 border-amber-200",
      )}
    >
      <p
        className={cn(
          "text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5",
          tone === "brand" ? "text-white/80" : "text-ash-500",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-semibold tabular mt-1",
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

function StatusBadge({
  status,
  t,
}: {
  status: "paid" | "pending" | "overdue";
  t: (k: string) => string;
}) {
  if (status === "paid")
    return (
      <span className="badge-success text-xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {t("status_paid")}
      </span>
    );
  if (status === "pending")
    return (
      <span className="badge-warning text-xs">
        <Clock className="w-3.5 h-3.5" />
        {t("status_pending")}
      </span>
    );
  return (
    <span className="badge-danger text-xs">
      <AlertCircle className="w-3.5 h-3.5" />
      {t("status_overdue")}
    </span>
  );
}
