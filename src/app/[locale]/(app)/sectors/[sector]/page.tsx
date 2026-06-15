import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getSectorDetail, isValidSectorKey } from "@/lib/sectors/data";
import { getAdvisorClientsBrief } from "@/lib/data";
import { SectorDetailView } from "@/components/sectors/SectorDetailView";

function parseClientIds(sp: { client?: string; clients?: string }): string[] {
  const raw = sp.clients ?? sp.client ?? "";
  if (!raw) return [];
  return Array.from(new Set(raw.split(",").map((s) => s.trim()).filter(Boolean)));
}

export default async function SectorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; sector: string }>;
  searchParams: Promise<{ client?: string; clients?: string }>;
}) {
  const { locale, sector } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  if (!isValidSectorKey(sector)) notFound();
  const detail = getSectorDetail(sector);
  if (!detail) notFound();

  const clients = await getAdvisorClientsBrief(session.user.advisorId);

  return (
    <SectorDetailView
      locale={locale}
      detail={detail}
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
