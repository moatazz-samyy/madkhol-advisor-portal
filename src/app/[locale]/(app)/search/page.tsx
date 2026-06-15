import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorClientsBrief, getAdvisorModels } from "@/lib/data";
import { isFinnhubEnabled } from "@/lib/universal-search/finnhub";
import { ASSETS } from "@/lib/universal-search/data";
import { getSearchPreferences } from "@/lib/universal-search/preferences";
import { getSymbolPositionsForAdvisor } from "@/lib/universal-search/positions";
import { getWatchlistsForAdvisor } from "@/lib/universal-search/watchlists";
import { getAssetNotesForAdvisor } from "@/lib/universal-search/notes";
import { getAlertsForAdvisor } from "@/lib/universal-search/alerts";
import { UniversalSearch } from "@/components/search/UniversalSearch";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [models, clients, preferences, positionsMap, watchlists, notes, alerts] =
    await Promise.all([
      getAdvisorModels(session.user.advisorId),
      getAdvisorClientsBrief(session.user.advisorId),
      getSearchPreferences(session.user.advisorId),
      getSymbolPositionsForAdvisor(session.user.advisorId),
      getWatchlistsForAdvisor(session.user.advisorId),
      getAssetNotesForAdvisor(session.user.advisorId),
      getAlertsForAdvisor(session.user.advisorId),
    ]);
  // Serialize the Map for the client component prop boundary
  const positions = Object.fromEntries(positionsMap.entries());

  return (
    <UniversalSearch
      locale={locale}
      assets={ASSETS}
      models={models.map((m) => ({
        id: m.id,
        name: m.name,
        nameAr: m.nameAr,
        holdingsCount: m.holdingsCount,
      }))}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        aumSar: c.aumSar,
      }))}
      liveDataEnabled={isFinnhubEnabled()}
      initialPreferences={preferences}
      positions={positions}
      watchlists={watchlists}
      notes={notes}
      alerts={alerts}
    />
  );
}
