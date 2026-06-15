import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getSectorSummaries } from "@/lib/sectors/data";
import { getAdvisorClientsBrief } from "@/lib/data";
import { SectorHeatmap } from "@/components/sectors/SectorHeatmap";

// Accept either `?clients=id1,id2` (preferred, multi-select) or the legacy
// single-select `?client=id` form. Both resolve to a deduped string[].
function parseClientIds(sp: { client?: string; clients?: string }): string[] {
  const raw = sp.clients ?? sp.client ?? "";
  if (!raw) return [];
  return Array.from(new Set(raw.split(",").map((s) => s.trim()).filter(Boolean)));
}

export default async function SectorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string; clients?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [summaries, clients] = await Promise.all([
    Promise.resolve(getSectorSummaries()),
    getAdvisorClientsBrief(session.user.advisorId),
  ]);

  return (
    <SectorHeatmap
      locale={locale}
      summaries={summaries}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        aumSar: c.aumSar,
      }))}
      activeClientIds={parseClientIds(sp)}
    />
  );
}
