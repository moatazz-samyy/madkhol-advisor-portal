import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorFunds, getEligibleClientsForAllocation } from "@/lib/data";
import { AllocationWizard } from "@/components/tools/AllocationWizard";

export default async function AllocationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [funds, clients] = await Promise.all([
    getAdvisorFunds(),
    getEligibleClientsForAllocation(session.user.advisorId),
  ]);

  return (
    <AllocationWizard
      locale={locale}
      funds={funds.map((f) => ({
        id: f.id,
        nameEn: f.nameEn,
        nameAr: f.nameAr,
        manager: f.fundManager,
        assetClass: f.assetClass,
        shariahCompliant: f.shariahCompliant,
        shariahStatusReason: f.shariahStatusReason ?? null,
        lastKnownNav: f.lastKnownNav,
        ytdReturn: f.ytdReturn,
      }))}
      clients={clients}
    />
  );
}
