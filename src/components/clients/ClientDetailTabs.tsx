"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";
import { fmtSar, fmtPct, fmtUnits, fmtGregorian } from "@/lib/format";
import {
  ShieldCheck,
  ShieldX,
  Trash2,
  FileDown,
  Inbox,
} from "lucide-react";
import { addNote, deleteNote } from "@/app/[locale]/(app)/clients/[id]/actions";

type Holding = {
  id: string;
  fundName: string;
  fundNameAr: string;
  assetClass: string;
  manager: string;
  shariahCompliant: boolean;
  units: number;
  currentValue: number;
  weight: number;
  target: number;
  drift: number;
  ytdReturn: number;
};

type Tx = {
  id: string;
  type: string;
  units: number;
  amountSar: number;
  fundName: string;
  fundNameAr: string;
  executedAt: string;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
};

const TAB_KEYS = ["portfolio", "performance", "activity", "documents", "notes"] as const;
type TabKey = (typeof TAB_KEYS)[number];

// Brand-coherent donut palette — deep → mid → light greens, plus warm + neutral
const DONUT_COLORS = [
  "#0C3D2E",
  "#156E47",
  "#2BBE7E",
  "#6BE07F",
  "#A8DDBA",
  "#DCEFD0",
  "#F5C66B", // warm gold for commodities
  "#D9E0DD",
  "#5E6964",
  "#0A2E1F",
];

export function ClientDetailTabs({
  locale,
  clientId,
  holdings,
  transactions,
  notes,
  ytdPct,
  totalValue,
}: {
  locale: string;
  clientId: string;
  holdings: Holding[];
  transactions: Tx[];
  notes: Note[];
  ytdPct: number;
  totalValue: number;
}) {
  const t = useTranslations("client");
  const ta = useTranslations("asset");
  const [tab, setTab] = useState<TabKey>("portfolio");

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-border flex gap-1 overflow-x-auto">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-4 py-3 text-sm font-medium relative transition whitespace-nowrap",
              tab === k
                ? "text-deep"
                : "text-ash-500 hover:text-deep",
            )}
          >
            {t(tabLabel(k))}
            {tab === k ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-madkhol-600 rounded-full" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "portfolio" ? (
          <PortfolioTab holdings={holdings} locale={locale} totalValue={totalValue} ta={ta} />
        ) : null}
        {tab === "performance" ? (
          <PerformanceTab ytdPct={ytdPct} totalValue={totalValue} locale={locale} />
        ) : null}
        {tab === "activity" ? <ActivityTab transactions={transactions} locale={locale} /> : null}
        {tab === "documents" ? <DocumentsTab /> : null}
        {tab === "notes" ? <NotesTab notes={notes} clientId={clientId} locale={locale} /> : null}
      </div>
    </div>
  );
}

function tabLabel(k: TabKey): string {
  return {
    portfolio: "tabPortfolio",
    performance: "tabPerformance",
    activity: "tabActivity",
    documents: "tabDocuments",
    notes: "tabNotes",
  }[k];
}

// ----------- Portfolio tab -----------

function PortfolioTab({
  holdings,
  locale,
  totalValue,
  ta,
}: {
  holdings: Holding[];
  locale: string;
  totalValue: number;
  ta: (key: string) => string;
}) {
  const t = useTranslations("client");
  const data = holdings.map((h) => ({
    name: locale === "ar" ? h.fundNameAr : h.fundName,
    value: h.currentValue,
  }));

  // Aggregate by asset class for the donut center copy
  const byClass = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.assetClass] = (acc[h.assetClass] ?? 0) + h.currentValue;
    return acc;
  }, {});
  const classBreakdown = Object.entries(byClass).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-semibold mb-1">{t("allocationTitle")}</h3>
        <p className="text-xs text-muted mb-4">
          {holdings.length} {locale === "ar" ? "موجود" : "holdings"}
        </p>
        <div className="h-[220px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <RPieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                stroke="white"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E7ECE9",
                  fontSize: 12,
                }}
                formatter={(v) => [`${fmtSar(Number(v))} SAR`, ""]}
              />
            </RPieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 space-y-2">
          {classBreakdown.slice(0, 5).map(([c, v], i) => (
            <li key={c} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: DONUT_COLORS[i] }}
              />
              <span className="flex-1 text-deep">{ta(c)}</span>
              <span className="text-muted tabular">
                {((v / Math.max(totalValue, 1)) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card overflow-hidden lg:col-span-3">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">{t("holdingsTitle")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("holdingFund")}</th>
                <th>{t("holdingClass")}</th>
                <th className="text-end">{t("holdingWeight")}</th>
                <th className="text-end">{t("holdingValue")}</th>
                <th className="text-end">{t("holdingDrift")}</th>
                <th>Shariah</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="font-medium leading-tight">
                      {locale === "ar" ? h.fundNameAr : h.fundName}
                    </div>
                    <div className="text-xs text-muted">{h.manager}</div>
                  </td>
                  <td>
                    <span className="badge-neutral">{ta(h.assetClass)}</span>
                  </td>
                  <td className="text-end tabular">{h.weight.toFixed(1)}%</td>
                  <td className="text-end tabular font-medium">
                    {fmtSar(h.currentValue)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                  <td className="text-end">
                    <DriftPill drift={h.drift} />
                  </td>
                  <td>
                    {h.shariahCompliant ? (
                      <span className="badge-success">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="badge-danger">
                        <ShieldX className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DriftPill({ drift }: { drift: number }) {
  const abs = Math.abs(drift);
  const tone =
    abs < 1.5
      ? "text-madkhol-700 bg-madkhol-50"
      : abs < 4
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50";
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-md text-xs font-medium tabular",
        tone,
      )}
    >
      {drift >= 0 ? "+" : ""}
      {drift.toFixed(1)}%
    </span>
  );
}

// ----------- Performance tab -----------

const PERIODS = ["1M", "3M", "YTD", "1Y", "All"] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_DAYS: Record<Period, number> = {
  "1M": 30,
  "3M": 90,
  YTD: 160, // demo date is mid-year
  "1Y": 365,
  All: 730,
};

function PerformanceTab({
  ytdPct,
  totalValue,
  locale,
}: {
  ytdPct: number;
  totalValue: number;
  locale: string;
}) {
  const t = useTranslations("client");
  const [period, setPeriod] = useState<Period>("YTD");

  // Synthesize a daily series with seeded jitter so the chart looks real
  const days = PERIOD_DAYS[period];
  const start = totalValue / (1 + ytdPct / 100);
  const benchmark = start * (1 + (ytdPct - 1.8) / 100);
  const data = Array.from({ length: days + 1 }, (_, i) => {
    const t = i / days;
    // Smooth growth + small sine + tiny seeded jitter
    const jitter = Math.sin(i * 0.31) * 0.004 + Math.sin(i * 0.07) * 0.008;
    const portfolioVal = start + (totalValue - start) * t * (1 + jitter);
    const benchmarkVal = start + (benchmark - start) * t * (1 + Math.sin(i * 0.13) * 0.005);
    return {
      day: i,
      portfolio: Math.round(portfolioVal),
      benchmark: Math.round(benchmarkVal),
    };
  });

  return (
    <div className="card p-5">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="font-semibold text-lg">{t("performanceTitle")}</h3>
          <p className="text-xs text-muted">{t("vsBenchmark")}</p>
        </div>
        <div className="inline-flex bg-ash-100 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition",
                period === p
                  ? "bg-white text-deep shadow-card"
                  : "text-ash-600 hover:text-deep",
              )}
            >
              {t(`period${p}` as "period1M")}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[320px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F0" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(d) =>
                period === "1Y" || period === "All"
                  ? `${Math.round((d / 30) as number)}M`
                  : `${d}d`
              }
              stroke="#8A968F"
              fontSize={11}
              reversed={locale === "ar"}
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
              formatter={(v) => `${fmtSar(Number(v))} SAR`}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="portfolio"
              name={locale === "ar" ? "المحفظة" : "Portfolio"}
              stroke="#2BBE7E"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="TASI"
              stroke="#5E6964"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm">
        <span className="text-muted">{period}:</span>
        <span
          className={cn(
            "font-semibold tabular",
            ytdPct >= 0 ? "text-madkhol-700" : "text-red-600",
          )}
        >
          {fmtPct(ytdPct)}
        </span>
      </div>
    </div>
  );
}

// ----------- Activity tab -----------

function ActivityTab({ transactions, locale }: { transactions: Tx[]; locale: string }) {
  const t = useTranslations("client");
  if (transactions.length === 0) {
    return <EmptyState label={locale === "ar" ? "لا معاملات" : "No transactions yet."} />;
  }
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold">{t("activityTitle")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{locale === "ar" ? "النوع" : "Type"}</th>
              <th>{t("holdingFund")}</th>
              <th className="text-end">{locale === "ar" ? "الوحدات" : "Units"}</th>
              <th className="text-end">{locale === "ar" ? "المبلغ" : "Amount"}</th>
              <th>{locale === "ar" ? "التاريخ" : "Executed"}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <span
                    className={
                      tx.type === "buy" ? "badge-success" : "badge-neutral"
                    }
                  >
                    {tx.type === "buy"
                      ? locale === "ar" ? "شراء" : "Buy"
                      : locale === "ar" ? "بيع" : "Sell"}
                  </span>
                </td>
                <td>{locale === "ar" ? tx.fundNameAr : tx.fundName}</td>
                <td className="text-end tabular">{fmtUnits(tx.units)}</td>
                <td className="text-end tabular font-medium">
                  {fmtSar(tx.amountSar)}{" "}
                  <span className="text-xs text-muted font-normal">SAR</span>
                </td>
                <td className="text-sm text-muted">
                  {fmtGregorian(new Date(tx.executedAt), locale as "ar" | "en")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------- Documents tab (skeleton) -----------

function DocumentsTab() {
  const t = useTranslations("client");
  const samples = [
    { name: "Monthly statement — May 2026", date: "2026-06-01" },
    { name: "Suitability questionnaire", date: "2024-09-12" },
    { name: "Advisory agreement", date: "2024-09-12" },
  ];
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">{t("documentsTitle")}</h3>
      </div>
      <ul className="divide-y divide-border">
        {samples.map((s) => (
          <li
            key={s.name}
            className="px-5 py-3.5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-ash-100 text-ash-500 grid place-items-center">
                <FileDown className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted">{s.date}</p>
              </div>
            </div>
            <button className="btn-ghost text-sm">
              <FileDown className="w-4 h-4" />
              PDF
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------- Notes tab -----------

function NotesTab({
  notes,
  clientId,
  locale,
}: {
  notes: Note[];
  clientId: string;
  locale: string;
}) {
  const t = useTranslations("client");
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">{t("notesTitle")}</h3>
      <form
        action={(formData) => {
          const body = String(formData.get("body") ?? "");
          start(async () => {
            await addNote(clientId, body);
            setDraft("");
          });
        }}
        className="flex gap-2 mb-5"
      >
        <input
          name="body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("notesPlaceholder")}
          className="input"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="btn-primary"
        >
          {t("addNote")}
        </button>
      </form>

      {notes.length === 0 ? (
        <EmptyState label={t("notesEmpty")} />
      ) : (
        <ul className="space-y-2.5">
          {notes.map((n) => (
            <li key={n.id} className="card p-3.5 flex items-start gap-3">
              <p className="flex-1 text-sm">{n.body}</p>
              <span className="text-xs text-muted shrink-0">
                {fmtGregorian(new Date(n.createdAt), locale as "ar" | "en")}
              </span>
              <form
                action={() => {
                  start(async () => {
                    await deleteNote(n.id, clientId);
                  });
                }}
              >
                <button
                  type="submit"
                  className="text-ash-400 hover:text-red-600 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-muted">
      <Inbox className="w-8 h-8 text-ash-300 mx-auto mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
