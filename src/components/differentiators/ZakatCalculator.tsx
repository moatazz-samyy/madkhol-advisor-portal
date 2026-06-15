"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar, fmtHijri, fmtGregorian } from "@/lib/format";
import {
  Receipt,
  ChevronLeft,
  Sparkles,
  Download,
  Send,
  CheckCircle2,
} from "lucide-react";
import { generateZakatReport } from "@/app/[locale]/(app)/zakat/actions";

const NISAB_SAR = 24750;

type Breakdown = { assetClass: string; valueSar: number; zakatable: boolean };

export function ZakatCalculator({
  locale,
  client,
  breakdown,
  lastReport,
}: {
  locale: string;
  client: {
    id: string;
    name: string;
    nameAr: string;
    hijriYearEndDate: string;
    totalAum: number;
    zakatableAssets: number;
    nonZakatableAssets: number;
  };
  breakdown: Breakdown[];
  lastReport: {
    id: string;
    hijriYear: number;
    zakatDueSar: number;
    generatedAt: string;
  } | null;
}) {
  const t = useTranslations("zakat");
  const ta = useTranslations("asset");
  const router = useRouter();

  const [generated, setGenerated] = useState(lastReport);
  const [generating, setGenerating] = useState(false);
  const [, startTransition] = useTransition();

  const above = client.zakatableAssets > NISAB_SAR;
  const zakatDue = above ? client.zakatableAssets * 0.025 : 0;
  const hijriEnd = new Date(client.hijriYearEndDate);

  async function generate() {
    setGenerating(true);
    try {
      const result = await generateZakatReport(client.id);
      setGenerated({
        id: result.reportId,
        hijriYear: 1447,
        zakatDueSar: result.zakatDueSar,
        generatedAt: new Date().toISOString(),
      });
      startTransition(() => router.refresh());
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/zakat`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-deep"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        {t("title")}
      </Link>

      <header className="card p-6 bg-brand-soft border-madkhol-100">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? client.nameAr : client.name}
            </h1>
            <p className="text-sm text-muted mt-1">
              {t("hijriYearEnd")}:{" "}
              {fmtHijri(hijriEnd, locale as "ar" | "en")}
              <span className="mx-2 text-ash-300">·</span>
              {fmtGregorian(hijriEnd, locale as "ar" | "en")}
            </p>
          </div>
          {generated ? (
            <span className="badge-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("generated")}
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="card p-5 lg:col-span-1 bg-brand-gradient text-white">
          <p className="text-xs uppercase tracking-wider font-semibold text-white/80">
            {t("summary")}
          </p>
          <p className="text-4xl font-semibold tabular mt-3">
            {fmtSar(zakatDue)}
            <span className="text-base font-normal text-white/70 ms-2">SAR</span>
          </p>
          <p className="text-xs text-white/80 mt-1">{t("ratePct")}</p>

          <div className="mt-6 space-y-3 text-sm">
            <Row label={t("totalAssets")}>{fmtSar(client.totalAum)} SAR</Row>
            <Row label={t("deductions")}>{fmtSar(client.nonZakatableAssets)} SAR</Row>
            <Row label={t("zakatableAssets")}>
              <span className="font-semibold">
                {fmtSar(client.zakatableAssets)} SAR
              </span>
            </Row>
            <Row label={t("nisab")}>{fmtSar(NISAB_SAR)} SAR</Row>
          </div>

          <button
            onClick={generate}
            disabled={generating || !above}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-white text-deep hover:bg-cream transition disabled:opacity-50"
          >
            <Receipt className="w-4 h-4" />
            {generating
              ? locale === "ar" ? "جاري…" : "Generating…"
              : t("generateReport")}
          </button>
          {!above ? (
            <p className="text-xs text-white/70 text-center mt-2">
              {locale === "ar"
                ? "الأصول الزكوية أقل من النصاب."
                : "Zakatable assets below nisab."}
            </p>
          ) : null}
        </div>

        {/* Asset breakdown */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">{t("breakdown")}</h3>
          </div>
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("category")}</th>
                <th className="text-end">{t("value")}</th>
                <th className="text-end">{t("zakatable")}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.assetClass}>
                  <td className="font-medium">{ta(row.assetClass)}</td>
                  <td className="text-end tabular">
                    {fmtSar(row.valueSar)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                  <td className="text-end">
                    {row.zakatable ? (
                      <span className="badge-success text-xs">{t("yes")}</span>
                    ) : (
                      <span className="badge-neutral text-xs">{t("no")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t border-border bg-cream/60 text-xs text-muted">
            {t("explanationLine")}
          </div>
        </div>
      </section>

      {generated ? (
        <ReportPreview
          locale={locale}
          client={client}
          zakatDue={generated.zakatDueSar}
          hijriYear={generated.hijriYear}
        />
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
      <span className="text-white/80 text-xs">{label}</span>
      <span className="tabular">{children}</span>
    </div>
  );
}

function ReportPreview({
  locale,
  client,
  zakatDue,
  hijriYear,
}: {
  locale: string;
  client: { name: string; nameAr: string; totalAum: number; zakatableAssets: number; nonZakatableAssets: number };
  zakatDue: number;
  hijriYear: number;
}) {
  const t = useTranslations("zakat");
  const [sent, setSent] = useState(false);
  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-madkhol-600" />
          {t("previewTitle")}
        </h3>
        <div className="flex items-center gap-2">
          <button className="btn-outline text-xs">
            <Download className="w-3.5 h-3.5" />
            {t("downloadPdf")}
          </button>
          <button
            onClick={() => setSent(true)}
            className={cn("btn-gradient text-xs", sent && "opacity-70")}
          >
            <Send className="w-3.5 h-3.5" />
            {sent ? t("sent") : t("sendToClient")}
          </button>
        </div>
      </div>
      <div className="p-8 bg-cream/60">
        {/* Mock paper */}
        <div className="bg-white rounded-2xl shadow-soft border border-border p-10 max-w-2xl mx-auto">
          <div className="text-center border-b border-border pb-6 mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-deep grid place-items-center">
                <span className="text-white text-xs font-bold">م</span>
              </div>
              <span className="font-semibold tracking-tight">Madkhol</span>
            </div>
            <h2 className="text-2xl font-semibold tabular">
              {t("filingFor", { year: hijriYear })}
            </h2>
            <p className="text-sm text-muted mt-2">
              {locale === "ar" ? client.nameAr : client.name}
            </p>
          </div>

          <dl className="space-y-3 text-sm">
            <ReportRow label={t("totalAssets")}>
              {fmtSar(client.totalAum)} SAR
            </ReportRow>
            <ReportRow label={t("deductions")}>
              {fmtSar(client.nonZakatableAssets)} SAR
            </ReportRow>
            <ReportRow label={t("zakatableAssets")}>
              <span className="font-semibold">{fmtSar(client.zakatableAssets)} SAR</span>
            </ReportRow>
            <ReportRow label={t("nisab")}>{fmtSar(NISAB_SAR)} SAR</ReportRow>
            <div className="pt-4 border-t border-border" />
            <ReportRow label={t("zakatDue")}>
              <span className="text-2xl font-semibold text-madkhol-700 tabular">
                {fmtSar(zakatDue)}{" "}
                <span className="text-sm text-muted font-normal">SAR</span>
              </span>
            </ReportRow>
          </dl>

          <p className="text-xs text-muted mt-8 leading-relaxed">
            {t("explanationLine")}
          </p>
        </div>
      </div>
    </section>
  );
}

function ReportRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular">{children}</dd>
    </div>
  );
}
