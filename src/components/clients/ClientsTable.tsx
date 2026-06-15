"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { fmtSar, fmtPct, relTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  Clock,
  CircleAlert,
  Eye,
  MessageCircle,
  Settings2,
} from "lucide-react";

type ClientRow = {
  id: string;
  name: string;
  nameAr: string;
  status: string;
  aumSar: number;
  ytdPnlPct: number;
  lastActivityAt: string;
  joinedAt: string;
  shariahStatus: "compliant" | "drift" | "nonCompliant";
  hijriDaysLeft: number;
  isNew: boolean;
};

export function ClientsTable({
  clients,
  locale,
}: {
  clients: ClientRow[];
  locale: string;
}) {
  const t = useTranslations("clients");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "pending_nafath">("all");
  const [shariah, setShariah] = useState<"all" | "compliant" | "drift" | "nonCompliant">("all");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (shariah !== "all" && c.shariahStatus !== shariah) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        if (
          !c.name.toLowerCase().includes(needle) &&
          !c.nameAr.includes(q.trim())
        )
          return false;
      }
      return true;
    });
  }, [clients, q, status, shariah]);

  return (
    <div className="card overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="input ps-9"
          />
        </div>
        <Select
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            { value: "all", label: t("filterStatus") + ": " + t("all") },
            { value: "active", label: t("statusActive") },
            { value: "pending_nafath", label: t("statusPending") },
          ]}
        />
        <Select
          value={shariah}
          onChange={(v) => setShariah(v as typeof shariah)}
          options={[
            { value: "all", label: t("filterShariah") + ": " + t("all") },
            { value: "compliant", label: t("shariahCompliant") },
            { value: "drift", label: t("shariahDrift") },
            { value: "nonCompliant", label: t("shariahNonCompliant") },
          ]}
        />
        <div className="text-xs text-ash-500 ms-auto">
          {filtered.length} / {clients.length}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center">{t("noResults")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th className="text-end">{t("aum")}</th>
                <th className="text-end">{t("ytdPnl")}</th>
                <th>{t("lastActivity")}</th>
                <th>{t("shariah")}</th>
                <th>{t("zakat")}</th>
                <th className="text-end">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <ClientRowDisplay
                  key={c.id}
                  c={c}
                  locale={locale}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientRowDisplay({
  c,
  locale,
  t,
}: {
  c: ClientRow;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <tr>
      <td>
        <Link
          href={`/${locale}/clients/${c.id}`}
          className="flex items-center gap-3 group"
        >
          <span className="w-9 h-9 rounded-full bg-ash-100 text-ash-600 grid place-items-center text-xs font-semibold shrink-0">
            {(locale === "ar" ? c.nameAr : c.name)
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <p className="font-medium group-hover:text-madkhol-700">
              {locale === "ar" ? c.nameAr : c.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {c.isNew ? (
                <span className="badge bg-lime-soft text-madkhol-700 border border-madkhol-200">
                  {locale === "ar" ? "جديد" : "New"}
                </span>
              ) : null}
              {c.status === "pending_nafath" ? (
                <span className="badge bg-amber-50 text-amber-700">
                  {t("statusPending")}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </td>
      <td className="text-end font-semibold tabular">
        {fmtSar(c.aumSar)}{" "}
        <span className="text-xs text-muted font-normal">SAR</span>
      </td>
      <td className="text-end">
        <span
          className={cn(
            "text-sm font-medium tabular",
            c.ytdPnlPct >= 0 ? "text-madkhol-700" : "text-red-600",
          )}
        >
          {c.aumSar > 0 ? fmtPct(c.ytdPnlPct) : "—"}
        </span>
      </td>
      <td className="text-sm text-muted">
        {c.aumSar > 0 ? relTime(new Date(c.lastActivityAt), locale as "ar" | "en") : "—"}
      </td>
      <td>
        <ShariahBadge status={c.shariahStatus} t={t} />
      </td>
      <td>
        <ZakatBadge daysLeft={c.hijriDaysLeft} t={t} />
      </td>
      <td className="text-end">
        <div className="inline-flex items-center gap-1">
          <Link
            href={`/${locale}/clients/${c.id}`}
            className="btn-ghost px-2 py-1.5"
            aria-label="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button className="btn-ghost px-2 py-1.5" aria-label="Message">
            <MessageCircle className="w-4 h-4" />
          </button>
          <button className="btn-ghost px-2 py-1.5" aria-label="Manage">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ShariahBadge({
  status,
  t,
}: {
  status: "compliant" | "drift" | "nonCompliant";
  t: (key: string) => string;
}) {
  if (status === "compliant")
    return (
      <span className="badge-success">
        <ShieldCheck className="w-3.5 h-3.5" />
        {t("shariahCompliant")}
      </span>
    );
  if (status === "drift")
    return (
      <span className="badge-warning">
        <ShieldAlert className="w-3.5 h-3.5" />
        {t("shariahDrift")}
      </span>
    );
  return (
    <span className="badge-danger">
      <ShieldX className="w-3.5 h-3.5" />
      {t("shariahNonCompliant")}
    </span>
  );
}

function ZakatBadge({
  daysLeft,
  t,
}: {
  daysLeft: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (daysLeft < 0)
    return (
      <span className="badge-danger">
        <CircleAlert className="w-3.5 h-3.5" />
        {t("zakatOverdue")}
      </span>
    );
  if (daysLeft <= 30)
    return (
      <span className="badge-warning">
        <Clock className="w-3.5 h-3.5" />
        {t("zakatDueIn", { n: daysLeft })}
      </span>
    );
  return (
    <span className="badge-success">
      <CheckCircle2 className="w-3.5 h-3.5" />
      {t("zakatFiled")}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input w-auto py-2 pe-9 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
