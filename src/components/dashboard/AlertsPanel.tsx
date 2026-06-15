import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ShieldAlert,
  CalendarClock,
  Sparkles,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import type { AlertItem } from "@/lib/data";
import { cn } from "@/lib/cn";

const ICONS: Record<AlertItem["type"], typeof ShieldAlert> = {
  shariahDrift: ShieldAlert,
  zakatDue: CalendarClock,
  zakatOverdue: CalendarClock,
  drawdown: TrendingDown,
  newClient: Sparkles,
};

const TONES: Record<
  AlertItem["type"],
  { bg: string; fg: string; ring: string }
> = {
  shariahDrift: { bg: "bg-amber-50", fg: "text-amber-700", ring: "ring-amber-200" },
  zakatDue:     { bg: "bg-madkhol-50", fg: "text-madkhol-700", ring: "ring-madkhol-200" },
  zakatOverdue: { bg: "bg-red-50", fg: "text-red-700", ring: "ring-red-200" },
  drawdown:     { bg: "bg-red-50", fg: "text-red-700", ring: "ring-red-200" },
  newClient:    { bg: "bg-lime-soft", fg: "text-madkhol-700", ring: "ring-madkhol-200" },
};

export async function AlertsPanel({
  alerts,
  locale,
}: {
  alerts: AlertItem[];
  locale: "ar" | "en";
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{t("topAlerts")}</h3>
        <span className="badge-neutral">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">
          {t("emptyAlerts")}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {alerts.slice(0, 5).map((a) => {
            const Icon = ICONS[a.type];
            const tone = TONES[a.type];
            return (
              <li key={a.id}>
                <Link
                  href={`/${locale}${a.href}`}
                  className="group flex items-center gap-3 p-3 rounded-xl hover:bg-ash-50 transition"
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-xl grid place-items-center shrink-0 ring-1",
                      tone.bg,
                      tone.fg,
                      tone.ring,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {locale === "ar" ? a.titleAr : a.title}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {locale === "ar" ? a.detailAr : a.detail}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ash-300 group-hover:text-deep rtl:rotate-180" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
