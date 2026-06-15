"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import {
  Award,
  Lock,
  ShieldCheck,
  AlertCircle,
  Star,
} from "lucide-react";
import type {
  CertificationStatus,
  Specialization,
} from "@/lib/marketplace/types";

type Row = {
  id: string;
  advisorId: string;
  advisorName: string;
  advisorNameAr: string;
  licenseNo: string;
  yearsExperience: number;
  specializations: Specialization[];
  feeBps: number;
  totalAumSar: number;
  currentClientCount: number;
  visible: boolean;
  certificationStatus: CertificationStatus;
  certifiedAt: string | null;
  inquiryCount: number;
  internalRating: number | null;
  internalNotes: string | null;
};

export function CertificationsView({
  locale,
  rows,
}: {
  locale: string;
  rows: Row[];
}) {
  const t = useTranslations("marketplace");

  const pending = rows.filter((r) => r.certificationStatus === "pending");
  const certified = rows.filter((r) => r.certificationStatus === "certified");
  const suspended = rows.filter((r) => r.certificationStatus === "suspended");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("certHubTitle")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("certHubSubtitle")}</p>
        </div>
        <span className="badge-neutral inline-flex items-center gap-1.5 text-xs">
          <Lock className="w-3.5 h-3.5" />
          {locale === "ar" ? "وصول الأدمن فقط" : "Admin only"}
        </span>
      </header>

      {/* Pending */}
      <Section
        Icon={AlertCircle}
        title={t("certPending")}
        count={pending.length}
        tone="warn"
      >
        {pending.length === 0 ? (
          <Empty label={locale === "ar" ? "لا طلبات معلّقة." : "No pending certifications."} />
        ) : (
          <CertTable rows={pending} locale={locale} showRating={false} t={t} />
        )}
      </Section>

      {/* Certified */}
      <Section
        Icon={ShieldCheck}
        title={t("certCertified")}
        count={certified.length}
        tone="good"
      >
        <CertTable rows={certified} locale={locale} showRating={true} t={t} />
      </Section>

      {/* Suspended */}
      {suspended.length > 0 ? (
        <Section
          Icon={AlertCircle}
          title={t("certSuspended")}
          count={suspended.length}
          tone="bad"
        >
          <CertTable rows={suspended} locale={locale} showRating={true} t={t} />
        </Section>
      ) : null}

      {/* Internal note about ratings */}
      <div className="card p-4 bg-cream/40 border-ash-200 text-xs text-ash-600 flex items-start gap-2">
        <Star className="w-4 h-4 text-ash-400 shrink-0 mt-0.5" />
        <p>
          <strong>{t("internalMetricsTitle")}.</strong> {t("internalMetricsNote")}
        </p>
      </div>
    </div>
  );
}

function Section({
  Icon,
  title,
  count,
  tone,
  children,
}: {
  Icon: typeof Award;
  title: string;
  count: number;
  tone: "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div
        className={cn(
          "px-5 py-3 border-b border-border flex items-center gap-2",
          tone === "good" && "bg-madkhol-50/50",
          tone === "warn" && "bg-amber-50/40",
          tone === "bad" && "bg-red-50/40",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            tone === "good" && "text-madkhol-700",
            tone === "warn" && "text-amber-700",
            tone === "bad" && "text-red-700",
          )}
        />
        <h3 className="font-semibold flex-1">{title}</h3>
        <span className="badge-neutral text-xs">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="p-10 text-center text-sm text-muted">{label}</p>;
}

function CertTable({
  rows,
  locale,
  showRating,
  t,
}: {
  rows: Row[];
  locale: string;
  showRating: boolean;
  t: (key: string) => string;
}) {
  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>{t("fieldName")}</th>
          <th>{locale === "ar" ? "الترخيص" : "License"}</th>
          <th className="text-end">{t("profileExperience")}</th>
          <th className="text-end">{t("totalAum")}</th>
          <th className="text-end">{t("inquiriesTitle")}</th>
          <th>{locale === "ar" ? "مرئي" : "Visible"}</th>
          {showRating ? <th className="text-end">{t("ratingInternal")}</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <div>
                <p className="text-sm font-medium">
                  {locale === "ar" ? r.advisorNameAr : r.advisorName}
                </p>
                <p className="text-[10px] text-muted">
                  {r.specializations.slice(0, 2).map((s) => t(`spec_${s}`)).join(" · ")}
                </p>
              </div>
            </td>
            <td className="font-mono text-xs text-muted">{r.licenseNo}</td>
            <td className="text-end tabular text-sm">{r.yearsExperience} y</td>
            <td className="text-end tabular text-sm font-medium">
              {fmtSar(r.totalAumSar)} <span className="text-xs text-muted">SAR</span>
            </td>
            <td className="text-end tabular">{r.inquiryCount}</td>
            <td>
              {r.visible ? (
                <span className="badge-success text-xs">
                  <ShieldCheck className="w-3 h-3" />
                </span>
              ) : (
                <span className="badge-neutral text-xs">—</span>
              )}
            </td>
            {showRating ? (
              <td className="text-end">
                {r.internalRating !== null ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium tabular">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {r.internalRating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
