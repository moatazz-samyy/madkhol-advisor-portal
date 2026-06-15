import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorFunds, getAdvisorModels } from "@/lib/data";
import { ModelsView } from "@/components/tools/ModelsView";

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [funds, models] = await Promise.all([
    getAdvisorFunds(),
    getAdvisorModels(session.user.advisorId),
  ]);

  return (
    <ModelsView
      locale={locale}
      models={models}
      funds={funds.map((f) => ({
        id: f.id,
        nameEn: f.nameEn,
        nameAr: f.nameAr,
        manager: f.fundManager,
        assetClass: f.assetClass,
        shariahCompliant: f.shariahCompliant,
      }))}
    />
  );
}
