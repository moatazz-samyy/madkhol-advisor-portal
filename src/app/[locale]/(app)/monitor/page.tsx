import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getMonitorPreferences } from "@/lib/monitor/preferences";
import { getSectorSummaries } from "@/lib/sectors/data";
import { getWatchlistsForAdvisor } from "@/lib/universal-search/watchlists";
import { ASSETS } from "@/lib/universal-search/data";
import { MonitorPage } from "@/components/monitor/MonitorPage";

export default async function MonitorRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [preferences, watchlists] = await Promise.all([
    getMonitorPreferences(session.user.advisorId),
    getWatchlistsForAdvisor(session.user.advisorId),
  ]);

  // Sectors are cheap to compute — synchronous accessor backed by static data.
  const sectors = getSectorSummaries();

  return (
    <MonitorPage
      locale={locale}
      initialWidgets={preferences.widgets}
      sectors={sectors}
      watchlists={watchlists}
      assets={ASSETS}
    />
  );
}
