"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { fmtSar, fmtHijri, fmtGregorian } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Receipt, Clock, CircleAlert, CheckCircle2, ChevronRight } from "lucide-react";

type QueueItem = {
  id: string;
  name: string;
  nameAr: string;
  hijriYearEndDate: string;
  hijriDaysLeft: number;
  totalAum: number;
  zakatableAssets: number;
  nonZakatableAssets: number;
  zakatDue: number;
  hasReport: boolean;
  lastReportAt: string | null;
};

export function ZakatQueueView({
  locale,
  queue,
}: {
  locale: string;
  queue: QueueItem[];
}) {
  const t = useTranslations("zakat");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">{t("queueTitle")}</h3>
          <p className="text-xs text-muted mt-0.5">{t("queueSubtitle")}</p>
        </div>
        {queue.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted">
            <Receipt className="w-7 h-7 text-ash-300 mx-auto mb-2" />
            {t("noClients")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((c) => {
              const overdue = c.hijriDaysLeft < 0;
              const tone = overdue
                ? "danger"
                : c.hijriDaysLeft <= 30
                ? "warning"
                : "success";
              return (
                <li key={c.id}>
                  <Link
                    href={`/${locale}/zakat/${c.id}`}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-ash-50 transition group"
                  >
                    <span
                      className={cn(
                        "w-10 h-10 rounded-xl grid place-items-center shrink-0",
                        tone === "danger" && "bg-red-50 text-red-700",
                        tone === "warning" && "bg-amber-50 text-amber-700",
                        tone === "success" && "bg-madkhol-50 text-madkhol-700",
                      )}
                    >
                      {overdue ? (
                        <CircleAlert className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {locale === "ar" ? c.nameAr : c.name}
                      </p>
                      <p className="text-xs text-muted">
                        {t("hijriYearEnd")}:{" "}
                        {fmtHijri(new Date(c.hijriYearEndDate), locale as "ar" | "en")}
                        <span className="mx-2 text-ash-300">·</span>
                        {fmtGregorian(
                          new Date(c.hijriYearEndDate),
                          locale as "ar" | "en",
                        )}
                      </p>
                    </div>
                    <div className="hidden sm:block text-end shrink-0">
                      <p className="text-xs text-muted">{t("zakatableAssets")}</p>
                      <p className="text-sm font-semibold tabular">
                        {fmtSar(c.zakatableAssets)}{" "}
                        <span className="text-xs text-muted font-normal">SAR</span>
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs text-muted">{t("zakatDue")}</p>
                      <p className="text-sm font-semibold tabular text-madkhol-700">
                        {fmtSar(c.zakatDue)}{" "}
                        <span className="text-xs text-muted font-normal">SAR</span>
                      </p>
                    </div>
                    <div
                      className={cn(
                        "badge text-xs",
                        tone === "danger" && "bg-red-50 text-red-700",
                        tone === "warning" && "bg-amber-50 text-amber-700",
                        tone === "success" && "bg-madkhol-50 text-madkhol-700",
                      )}
                    >
                      {overdue
                        ? t("overdue", { n: Math.abs(c.hijriDaysLeft) })
                        : t("daysLeft", { n: c.hijriDaysLeft })}
                    </div>
                    {c.hasReport ? (
                      <span className="badge-success text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("generated")}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-ash-300 group-hover:text-deep rtl:rotate-180" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
