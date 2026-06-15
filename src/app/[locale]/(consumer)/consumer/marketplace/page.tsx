import { setRequestLocale } from "next-intl/server";
import { listCertifiedAdvisors } from "@/lib/marketplace/data";
import { MarketplaceList } from "@/components/marketplace/consumer/MarketplaceList";

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const advisors = await listCertifiedAdvisors();
  return <MarketplaceList locale={locale} advisors={advisors} />;
}
