import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getShariahOverview } from "@/lib/data";
import { ShariahDashboard } from "@/components/differentiators/ShariahDashboard";

export default async function ShariahPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const overview = await getShariahOverview(session.user.advisorId);

  return (
    <ShariahDashboard
      locale={locale}
      overview={{
        ...overview,
        alerts: overview.alerts.map((a) => ({
          ...a,
          detectedAt: a.detectedAt.toISOString(),
        })),
      }}
    />
  );
}
