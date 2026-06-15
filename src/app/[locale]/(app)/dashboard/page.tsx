import { getServerSession } from "next-auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getBookSummary,
  getTopAlerts,
  getTopClients,
  getRecentActivity,
} from "@/lib/data";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopClientsCard } from "@/components/dashboard/TopClientsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardBanner } from "@/components/madkhol-ai/DashboardBanner";
import { getConnection, getMockSuggestions } from "@/lib/madkhol-ai/data";
import { getAlertsForAdvisor } from "@/lib/universal-search/alerts";
import { TriggeredAlertsBanner } from "@/components/dashboard/TriggeredAlertsBanner";
import { Wallet, Users, TrendingUp, LineChart } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const advisorId = session.user.advisorId;
  const [summary, alerts, topClients, activity, t, connection, assetAlerts] =
    await Promise.all([
      getBookSummary(advisorId),
      getTopAlerts(advisorId),
      getTopClients(advisorId, 5),
      getRecentActivity(advisorId, 10),
      getTranslations("dashboard"),
      getConnection(advisorId),
      getAlertsForAdvisor(advisorId),
    ]);
  const pendingSuggestions = connection.connected ? getMockSuggestions().length : 0;

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "morning" : "afternoon";
  const name =
    locale === "ar" ? session.user.nameAr?.split(" ")[0] : session.user.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(greetingKey, { name: name ?? "" })}
        </h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </header>

      <DashboardBanner
        locale={locale}
        connected={connection.connected}
        pendingSuggestions={pendingSuggestions}
      />

      <TriggeredAlertsBanner locale={locale} alerts={assetAlerts} />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t("totalAum")}
          value={summary.totalAum}
          format="sar"
          Icon={Wallet}
          tone="brand"
        />
        <StatCard
          label={t("totalClients")}
          value={summary.totalClients}
          format="int"
          subtext={
            summary.pendingClients > 0
              ? `${summary.pendingClients} ${
                  locale === "ar" ? "بانتظار نفاذ" : "pending Nafath"
                }`
              : undefined
          }
          Icon={Users}
        />
        <StatCard
          label={t("mtdPnl")}
          value={summary.mtdPnlSar}
          format="sar"
          changePct={summary.mtdPnlPct}
          Icon={TrendingUp}
        />
        <StatCard
          label={t("ytdPnl")}
          value={summary.ytdPnlSar}
          format="sar"
          changePct={summary.ytdPnlPct}
          Icon={LineChart}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel alerts={alerts} locale={locale as "ar" | "en"} />
        <TopClientsCard
          clients={topClients}
          locale={locale as "ar" | "en"}
          title={t("topClients")}
        />
      </section>

      <section>
        <ActivityFeed activity={activity} locale={locale as "ar" | "en"} />
      </section>
    </div>
  );
}
