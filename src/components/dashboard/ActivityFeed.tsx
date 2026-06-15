import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fmtSar, relTime } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

type Tx = {
  id: string;
  type: string;
  amountSar: number;
  fundName: string;
  fundNameAr: string;
  clientName: string;
  clientNameAr: string;
  clientId: string;
  executedAt: Date;
};

export async function ActivityFeed({
  activity,
  locale,
}: {
  activity: Tx[];
  locale: "ar" | "en";
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{t("recentActivity")}</h3>
      </div>
      {activity.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">{t("emptyActivity")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {activity.map((tx) => {
            const isBuy = tx.type === "buy";
            const Icon = isBuy ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={tx.id} className="py-3 flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                    isBuy
                      ? "bg-madkhol-50 text-madkhol-700"
                      : "bg-ash-100 text-ash-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">
                      {isBuy
                        ? locale === "ar" ? "شراء" : "Buy"
                        : locale === "ar" ? "بيع" : "Sell"}
                    </span>{" "}
                    <span className="text-ash-500">
                      {locale === "ar" ? tx.fundNameAr : tx.fundName}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    <Link
                      href={`/${locale}/clients/${tx.clientId}`}
                      className="hover:text-deep"
                    >
                      {locale === "ar" ? tx.clientNameAr : tx.clientName}
                    </Link>{" "}
                    · {relTime(tx.executedAt, locale)}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular">
                  {fmtSar(tx.amountSar)}{" "}
                  <span className="text-xs text-muted font-normal">SAR</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
