"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar, fmtPct, relTime } from "@/lib/format";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  TrendingUp,
  ArrowRight,
  X,
} from "lucide-react";
import {
  resolveShariahAlert,
  loadAlertDetail,
} from "@/app/[locale]/(app)/shariah/actions";

type Alert = {
  id: string;
  fundId: string;
  fundName: string;
  fundNameAr: string;
  fundManager: string;
  assetClass: string;
  reason: string;
  shariahStatusReason: string | null;
  detectedAt: string;
  affectedClientCount: number;
  resolved: boolean;
};

type PerClient = {
  id: string;
  name: string;
  nameAr: string;
  nonCompliantSar: number;
  totalSar: number;
  pctNonCompliant: number;
  flaggedFundIds: string[];
};

type Overview = {
  totalAum: number;
  nonCompliantAum: number;
  compliantPct: number;
  openAlerts: number;
  affectedClientCount: number;
  alerts: Alert[];
  perClient: PerClient[];
};

type Replacement = {
  id: string;
  nameEn: string;
  nameAr: string;
  manager: string;
  assetClass: string;
  ytdReturn: number;
  fundFeeBps: number;
};

type AffectedClient = {
  clientId: string;
  clientName: string;
  clientNameAr: string;
  exposureSar: number;
  exposurePct: number;
};

export function ShariahDashboard({
  locale,
  overview,
}: {
  locale: string;
  overview: Overview;
}) {
  const t = useTranslations("shariah");
  const ta = useTranslations("asset");
  const router = useRouter();
  const [drill, setDrill] = useState<Alert | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      {/* Top: book health */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard
          label={t("compliantPct")}
          value={`${overview.compliantPct.toFixed(1)}%`}
          tone={overview.compliantPct >= 97 ? "good" : overview.compliantPct >= 90 ? "warn" : "bad"}
          Icon={ShieldCheck}
          sub={
            <span className="tabular text-xs text-white/80">
              {fmtSar(overview.totalAum - overview.nonCompliantAum)} / {fmtSar(overview.totalAum)} SAR
            </span>
          }
        />
        <HealthCard
          label={t("openAlerts")}
          value={overview.openAlerts}
          tone={overview.openAlerts === 0 ? "good" : "warn"}
          Icon={AlertCircle}
          sub={
            <span className="text-xs">
              {overview.alerts.filter((a) => a.resolved).length}{" "}
              {locale === "ar" ? "تمت معالجتها" : "resolved"}
            </span>
          }
        />
        <HealthCard
          label={t("affectedClients")}
          value={overview.affectedClientCount}
          tone={overview.affectedClientCount === 0 ? "good" : "warn"}
          Icon={Users}
          sub={
            <span className="text-xs">
              {fmtSar(overview.nonCompliantAum)} SAR{" "}
              {locale === "ar" ? "غير متوافقة" : "non-compliant"}
            </span>
          }
        />
      </section>

      {/* Middle: alerts list */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">{t("alertsList")}</h3>
        </div>
        {overview.alerts.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-madkhol-700 mx-auto mb-2" />
            <p className="text-sm text-muted">{t("noAlerts")}</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("fund")}</th>
                <th>{ta("equity")}</th>
                <th className="text-end">{t("clients")}</th>
                <th>{t("detected")}</th>
                <th className="text-end">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {overview.alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                          a.resolved
                            ? "bg-ash-100 text-ash-500"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="font-medium leading-tight">
                          {locale === "ar" ? a.fundNameAr : a.fundName}
                        </p>
                        <p className="text-xs text-muted">{a.fundManager}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-neutral">{ta(a.assetClass)}</span>
                  </td>
                  <td className="text-end font-medium tabular">
                    {a.affectedClientCount}
                  </td>
                  <td className="text-sm text-muted">
                    {relTime(new Date(a.detectedAt), locale as "ar" | "en")}
                  </td>
                  <td className="text-end">
                    {a.resolved ? (
                      <span className="badge-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("resolved")}
                      </span>
                    ) : (
                      <button
                        onClick={() => setDrill(a)}
                        className="btn-outline text-xs"
                      >
                        {t("openDetail")}
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Bottom: per-client compliance */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">{t("perClient")}</h3>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>{locale === "ar" ? "العميل" : "Client"}</th>
              <th className="text-end">{locale === "ar" ? "الأصول" : "AuM"}</th>
              <th className="text-end">{t("exposureSar")}</th>
              <th className="text-end">{t("exposurePct")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {overview.perClient.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  {locale === "ar" ? p.nameAr : p.name}
                </td>
                <td className="text-end tabular">
                  {fmtSar(p.totalSar)}{" "}
                  <span className="text-xs text-muted font-normal">SAR</span>
                </td>
                <td className="text-end tabular">
                  {p.nonCompliantSar > 0 ? (
                    <span className="text-red-600 font-medium">
                      {fmtSar(p.nonCompliantSar)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="text-end">
                  {p.pctNonCompliant > 5 ? (
                    <span className="badge-danger">
                      {p.pctNonCompliant.toFixed(1)}%
                    </span>
                  ) : p.pctNonCompliant > 0 ? (
                    <span className="badge-warning">
                      {p.pctNonCompliant.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="badge-success">
                      <ShieldCheck className="w-3 h-3" />
                      0%
                    </span>
                  )}
                </td>
                <td className="text-end">
                  <Link
                    href={`/${locale}/clients/${p.id}`}
                    className="btn-ghost text-xs"
                  >
                    {t("viewClient")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {drill ? (
        <AlertDrillModal
          alert={drill}
          locale={locale}
          onClose={() => setDrill(null)}
          onResolved={() => {
            setDrill(null);
            startTransition(() => router.refresh());
          }}
        />
      ) : null}
    </div>
  );
}

function HealthCard({
  label,
  value,
  sub,
  tone,
  Icon,
}: {
  label: string;
  value: string | number;
  sub: React.ReactNode;
  tone: "good" | "warn" | "bad";
  Icon: typeof ShieldCheck;
}) {
  return (
    <div
      className={cn(
        "stat-card text-white border-transparent relative overflow-hidden",
        tone === "good" && "bg-brand-gradient",
        tone === "warn" && "bg-gradient-to-br from-amber-500 to-amber-700",
        tone === "bad" && "bg-gradient-to-br from-red-500 to-red-700",
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-white/80">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <p className="text-3xl font-semibold tabular mt-1">{value}</p>
      <div className="text-white/80 mt-1">{sub}</div>
      <div className="absolute -end-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}

function AlertDrillModal({
  alert,
  locale,
  onClose,
  onResolved,
}: {
  alert: Alert;
  locale: string;
  onClose: () => void;
  onResolved: () => void;
}) {
  const t = useTranslations("shariah");
  const ta = useTranslations("asset");
  const [loading, setLoading] = useState(true);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [affected, setAffected] = useState<AffectedClient[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAlertDetail(alert.fundId).then((detail) => {
      if (cancelled) return;
      setReplacements(detail.replacements);
      setAffected(detail.affected);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [alert.fundId]);

  async function resolve() {
    setResolving(true);
    try {
      await resolveShariahAlert(alert.id);
      onResolved();
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-deep/40 backdrop-blur-sm z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-3xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 grid place-items-center">
              <ShieldX className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-semibold">
                {locale === "ar" ? alert.fundNameAr : alert.fundName}
              </h2>
              <p className="text-xs text-muted">
                {alert.fundManager} · {ta(alert.assetClass)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Reason */}
          <div className="card p-4 bg-amber-50 border-amber-200">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
              {t("reason")}
            </p>
            <p className="text-sm text-amber-900">
              {alert.shariahStatusReason ?? alert.reason}
            </p>
          </div>

          {/* Affected clients */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-ash-500" />
              {t("affectedClients")}
            </h3>
            {loading ? (
              <p className="text-sm text-muted py-4 text-center">…</p>
            ) : affected.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">
                {locale === "ar" ? "لا يوجد عملاء يحملون هذا الصندوق." : "No clients hold this fund."}
              </p>
            ) : (
              <ul className="card divide-y divide-border">
                {affected.map((c) => (
                  <li
                    key={c.clientId}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <Link
                      href={`/${locale}/clients/${c.clientId}`}
                      className="flex-1 text-sm font-medium hover:text-madkhol-700"
                    >
                      {locale === "ar" ? c.clientNameAr : c.clientName}
                    </Link>
                    <span className="text-sm tabular font-medium">
                      {fmtSar(c.exposureSar)}{" "}
                      <span className="text-xs text-muted font-normal">SAR</span>
                    </span>
                    <span className="badge-warning text-xs">
                      {c.exposurePct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Suggested replacements */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-madkhol-600" />
              {t("suggestedReplacements")}
            </h3>
            {loading ? (
              <p className="text-sm text-muted py-4 text-center">…</p>
            ) : replacements.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">
                {t("noReplacements")}
              </p>
            ) : (
              <ul className="space-y-2">
                {replacements.map((r) => (
                  <li
                    key={r.id}
                    className="card p-3.5 flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-xl bg-madkhol-50 text-madkhol-700 grid place-items-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {locale === "ar" ? r.nameAr : r.nameEn}
                      </p>
                      <p className="text-xs text-muted">
                        {r.manager} · {ta(r.assetClass)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span
                          className={cn(
                            "tabular font-medium",
                            r.ytdReturn >= 0 ? "text-madkhol-700" : "text-red-600",
                          )}
                        >
                          {fmtPct(r.ytdReturn)}
                        </span>
                      </p>
                      <p className="text-[10px] text-ash-400 tabular">
                        {r.fundFeeBps}bps
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">
            {locale === "ar" ? "إغلاق" : "Close"}
          </button>
          {!alert.resolved ? (
            <button
              onClick={resolve}
              disabled={resolving}
              className="btn-gradient"
            >
              {resolving ? t("resolving") : t("resolve")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

