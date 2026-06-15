import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getClientDetail } from "@/lib/data";
import { fmtSar, fmtPct, fmtGregorian, daysBetween } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ClientDetailTabs } from "@/components/clients/ClientDetailTabs";
import { ChevronLeft, MessageSquare, FileText, PlayCircle, Sliders, LineChart as LineChartIcon } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const client = await getClientDetail(session.user.advisorId, id);
  if (!client) notFound();

  const t = await getTranslations("client");
  const tc = await getTranslations("clients");

  const portfolio = client.portfolio;
  const totalHoldingValue =
    portfolio?.holdings.reduce((s, h) => s + h.currentValue, 0) ?? 0;
  let weightedYtd = 0;
  for (const h of portfolio?.holdings ?? []) {
    weightedYtd += h.currentValue * (h.fund.ytdReturn / 100);
  }
  const ytdPct =
    totalHoldingValue > 0 ? (weightedYtd / totalHoldingValue) * 100 : 0;
  const hijriDays = daysBetween(new Date(), client.hijriYearEndDate);

  // Plain serializable holdings for the tabs client component
  const holdings = (portfolio?.holdings ?? []).map((h) => {
    const weight = totalHoldingValue > 0 ? (h.currentValue / totalHoldingValue) * 100 : 0;
    // Synthetic equal-weight target across the same assets — replace once a model is assigned
    const target =
      totalHoldingValue > 0 ? 100 / (portfolio?.holdings.length ?? 1) : 0;
    return {
      id: h.id,
      fundName: h.fund.nameEn,
      fundNameAr: h.fund.nameAr,
      assetClass: h.fund.assetClass,
      manager: h.fund.fundManager,
      shariahCompliant: h.fund.shariahCompliant,
      units: h.units,
      currentValue: h.currentValue,
      weight,
      target,
      drift: weight - target,
      ytdReturn: h.fund.ytdReturn,
    };
  });

  const transactions = (portfolio?.transactions ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    units: tx.units,
    amountSar: tx.amountSar,
    fundName: tx.fund.nameEn,
    fundNameAr: tx.fund.nameAr,
    executedAt: tx.executedAt.toISOString(),
  }));

  const notes = client.notes.map((n) => ({
    id: n.id,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
  }));

  const displayName = locale === "ar" ? client.nameAr : client.name;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/${locale}/clients`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-deep"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        {tc("title")}
      </Link>

      {/* Header card */}
      <div className="card p-6 bg-brand-soft border-madkhol-100">
        <div className="flex flex-wrap items-start gap-6">
          <span className="w-16 h-16 rounded-2xl bg-brand-gradient text-white grid place-items-center text-xl font-semibold">
            {initials}
          </span>
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              {client.status === "active" ? (
                <span className="badge-success">{tc("statusActive")}</span>
              ) : (
                <span className="badge-warning">{tc("statusPending")}</span>
              )}
            </div>
            <p className="text-sm text-muted mt-1">
              {client.email} · {client.phone} ·{" "}
              {t("joinedOn", { date: fmtGregorian(client.joinedAt, locale as "ar" | "en") })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/messages?client=${client.id}&preset=statement`}
              className="btn-outline"
            >
              <MessageSquare className="w-4 h-4" />
              {t("sendStatement")}
            </Link>
            <Link href={`/${locale}/zakat/${client.id}`} className="btn-outline">
              <FileText className="w-4 h-4" />
              {t("generateZakat")}
            </Link>
            <Link
              href={`/${locale}/projections?subject=client_portfolio&id=${client.id}`}
              className="btn-outline"
            >
              <LineChartIcon className="w-4 h-4" />
              {locale === "ar" ? "توقع الأداء" : "Project performance"}
            </Link>
            <Link
              href={`/${locale}/optimizer?source=client&id=${client.id}`}
              className="btn-outline"
            >
              <Sliders className="w-4 h-4" />
              {locale === "ar" ? "تحسين المحفظة" : "Optimize"}
            </Link>
            <Link href={`/${locale}/rebalance`} className="btn-gradient">
              <PlayCircle className="w-4 h-4" />
              {t("applyModel")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-madkhol-200/60">
          <KV label={tc("aum")}>
            <span className="text-xl font-semibold tabular">
              {fmtSar(totalHoldingValue)}{" "}
              <span className="text-sm text-muted font-normal">SAR</span>
            </span>
          </KV>
          <KV label={tc("ytdPnl")}>
            <span
              className={cn(
                "text-xl font-semibold tabular",
                ytdPct >= 0 ? "text-madkhol-700" : "text-red-600",
              )}
            >
              {totalHoldingValue > 0 ? fmtPct(ytdPct) : "—"}
            </span>
          </KV>
          <KV label={locale === "ar" ? "نهاية السنة الهجرية" : "Hijri year-end"}>
            <span className="text-xl font-semibold tabular">
              {hijriDays > 0
                ? locale === "ar"
                  ? `${hijriDays} يوم`
                  : `in ${hijriDays}d`
                : locale === "ar"
                ? `متأخر ${Math.abs(hijriDays)} يوم`
                : `${Math.abs(hijriDays)}d overdue`}
            </span>
          </KV>
          <KV label={locale === "ar" ? "درجة الملاءمة" : "Suitability"}>
            <span className="text-xl font-semibold tabular">
              {client.suitabilityScore}
              <span className="text-sm text-muted font-normal">/100</span>
            </span>
          </KV>
        </div>
      </div>

      <ClientDetailTabs
        locale={locale}
        clientId={client.id}
        holdings={holdings}
        transactions={transactions}
        notes={notes}
        ytdPct={ytdPct}
        totalValue={totalHoldingValue}
      />
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
