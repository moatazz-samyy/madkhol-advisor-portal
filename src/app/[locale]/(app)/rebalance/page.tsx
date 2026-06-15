import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import {
  getAdvisorFunds,
  getAdvisorModels,
  getEligibleClientsForAllocation,
} from "@/lib/data";
import { RebalanceWizard } from "@/components/tools/RebalanceWizard";

export default async function RebalancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ model?: string }>;
}) {
  const { locale } = await params;
  const { model: preselectedModel } = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [funds, models, clients] = await Promise.all([
    getAdvisorFunds(),
    getAdvisorModels(session.user.advisorId),
    getEligibleClientsForAllocation(session.user.advisorId),
  ]);

  return (
    <RebalanceWizard
      locale={locale}
      funds={funds.map((f) => ({
        id: f.id,
        nameEn: f.nameEn,
        nameAr: f.nameAr,
        manager: f.fundManager,
        assetClass: f.assetClass,
        shariahCompliant: f.shariahCompliant,
        lastKnownNav: f.lastKnownNav,
      }))}
      models={models}
      clients={clients}
      preselectedModelId={preselectedModel ?? null}
    />
  );
}
