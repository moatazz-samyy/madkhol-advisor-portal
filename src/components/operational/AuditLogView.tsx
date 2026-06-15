"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtGregorian, relTime } from "@/lib/format";
import {
  Search,
  History,
  X,
  Sparkles,
  Brain,
  PieChart,
  Briefcase,
  ShieldAlert,
  Receipt,
  Mail,
  IdCard,
  Wallet,
  LineChart,
} from "lucide-react";

type Entry = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  payload: string;
  createdAt: string;
};

const ICONS: Record<string, typeof History> = {
  model_created: PieChart,
  model_updated: PieChart,
  model_deleted: PieChart,
  model_optimized: Sparkles,
  model_assets_added: PieChart,
  client_added: Briefcase,
  client_optimized: Sparkles,
  client_assets_added: Briefcase,
  allocation_order_executed: Wallet,
  rebalance_executed: Wallet,
  basket_buy_executed: Wallet,
  zakat_report_generated: Receipt,
  shariah_alert_resolved: ShieldAlert,
  madkhol_ai_connected: Brain,
  madkhol_ai_disconnected: Brain,
  projection_run: LineChart,
  marketplace_inquiry_received: Mail,
  marketplace_profile_saved: IdCard,
};

type Range = "24h" | "7d" | "30d" | "all";
const RANGE_HOURS: Record<Range, number | null> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  all: null,
};

export function AuditLogView({
  locale,
  advisorName,
  entries,
}: {
  locale: string;
  advisorName: string;
  entries: Entry[];
}) {
  const t = useTranslations("audit");

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [range, setRange] = useState<Range>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const allTypes = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.actionType);
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs = RANGE_HOURS[range] !== null ? RANGE_HOURS[range]! * 3600_000 : null;
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.actionType !== typeFilter) return false;
      if (rangeMs !== null && now - new Date(e.createdAt).getTime() > rangeMs) return false;
      if (needle) {
        const blob = `${e.entityId} ${e.payload}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      return true;
    });
  }, [entries, typeFilter, range, q]);

  const open = openId ? filtered.find((e) => e.id === openId) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
      </header>

      {/* Filter bar */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("filterSearch")}
            className="input ps-9 py-2 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto py-2 text-sm"
        >
          <option value="all">{t("allTypes")}</option>
          {allTypes.map((tp) => (
            <option key={tp} value={tp}>
              {t(`action_${tp}` as "action_model_created")}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="input w-auto py-2 text-sm"
        >
          <option value="24h">{t("last24h")}</option>
          <option value="7d">{t("last7d")}</option>
          <option value="30d">{t("last30d")}</option>
          <option value="all">{t("allTime")}</option>
        </select>
        <span className="text-xs text-muted ms-auto tabular">
          {t("resultCount", { n: filtered.length })}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center text-muted">{t("noResults")}</div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((e) => {
              const Icon = ICONS[e.actionType] ?? History;
              const tone =
                e.actionType.includes("deleted") ||
                e.actionType.includes("disconnected") ||
                e.actionType.includes("declined")
                  ? "warn"
                  : e.actionType.includes("approved") ||
                    e.actionType.includes("connected") ||
                    e.actionType.includes("created") ||
                    e.actionType.includes("executed")
                  ? "good"
                  : "neutral";
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setOpenId(e.id)}
                    className="w-full text-start p-4 hover:bg-ash-50/40 transition flex items-center gap-3"
                  >
                    <span
                      className={cn(
                        "w-9 h-9 rounded-xl grid place-items-center shrink-0",
                        tone === "good" && "bg-madkhol-50 text-madkhol-700",
                        tone === "warn" && "bg-amber-50 text-amber-700",
                        tone === "neutral" && "bg-ash-100 text-ash-500",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t(`action_${e.actionType}` as "action_model_created")}
                      </p>
                      <p className="text-xs text-muted font-mono truncate">
                        {e.entityType} · {e.entityId.slice(0, 24)}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs font-medium">
                        {relTime(new Date(e.createdAt), locale as "ar" | "en")}
                      </p>
                      <p className="text-[10px] text-muted">
                        {fmtGregorian(new Date(e.createdAt), locale as "ar" | "en")}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Detail drawer */}
      {open ? (
        <DetailDrawer
          entry={open}
          locale={locale}
          advisorName={advisorName}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}

function DetailDrawer({
  entry,
  locale,
  advisorName,
  onClose,
}: {
  entry: Entry;
  locale: string;
  advisorName: string;
  onClose: () => void;
}) {
  const t = useTranslations("audit");
  let parsed: unknown;
  try {
    parsed = JSON.parse(entry.payload);
  } catch {
    parsed = entry.payload;
  }
  return (
    <div
      className="fixed inset-0 z-50 grid"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.35)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "card shadow-soft h-full overflow-hidden flex flex-col w-full max-w-xl ms-auto",
          locale === "ar" ? "rounded-e-none rounded-s-2xl" : "rounded-s-none rounded-e-2xl",
        )}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{t("drawerTitle")}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              {t("colAction")}
            </p>
            <p className="text-base font-semibold">
              {t(`action_${entry.actionType}` as "action_model_created")}
            </p>
            <p className="text-xs text-muted font-mono mt-0.5">{entry.actionType}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Fact label={t("drawerEntity")}>{entry.entityType}</Fact>
            <Fact label={t("drawerCreatedAt")}>
              {fmtGregorian(new Date(entry.createdAt), locale as "ar" | "en")}
            </Fact>
            <Fact label={t("drawerAdvisor")}>{advisorName}</Fact>
            <Fact label={t("drawerEntityId")}>
              <code className="font-mono text-[11px] break-all">{entry.entityId}</code>
            </Fact>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
              {t("drawerPayload")}
            </p>
            <pre
              className="card bg-cream/40 p-3 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all"
              dir="ltr"
            >
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm">{children}</p>
    </div>
  );
}
