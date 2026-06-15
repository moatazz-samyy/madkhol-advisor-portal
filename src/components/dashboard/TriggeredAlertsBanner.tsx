import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Zap, ArrowRight } from "lucide-react";
import { fmtAlertValue } from "@/lib/universal-search/alerts";
import type { AlertWithStatus } from "@/lib/universal-search/alerts";

export async function TriggeredAlertsBanner({
  locale,
  alerts,
}: {
  locale: string;
  alerts: AlertWithStatus[];
}) {
  const triggered = alerts.filter((a) => a.triggered);
  if (triggered.length === 0) return null;
  const t = await getTranslations("search");

  // Show up to 3 inline, then "+N more"
  const preview = triggered.slice(0, 3);
  const overflow = triggered.length - preview.length;

  return (
    <div className="card p-4 bg-amber-50 border-amber-300 flex items-center gap-4 flex-wrap">
      <span className="w-10 h-10 rounded-xl bg-amber-500 text-white grid place-items-center shrink-0">
        <Zap className="w-5 h-5 fill-current" />
      </span>
      <div className="flex-1 min-w-[240px]">
        <p className="text-sm font-semibold text-amber-900">
          {t("alertBannerTitle", { n: triggered.length })}
        </p>
        <p className="text-xs text-amber-800 mt-0.5">
          {preview
            .map(
              (a) =>
                `${a.symbol} ${t(`alertOp_${a.op}`)} ${fmtAlertValue(
                  a.metric,
                  a.threshold,
                )}${
                  a.currentValue !== null
                    ? ` (${t("alertNow")} ${fmtAlertValue(a.metric, a.currentValue)})`
                    : ""
                }`,
            )
            .join(" · ")}
          {overflow > 0 ? ` · +${overflow} ${t("alertBannerMore")}` : ""}
        </p>
      </div>
      <Link
        href={`/${locale}/search`}
        className="btn-outline border-amber-400 text-amber-900 hover:bg-amber-100"
      >
        {t("alertBannerCta")}
        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
      </Link>
    </div>
  );
}
