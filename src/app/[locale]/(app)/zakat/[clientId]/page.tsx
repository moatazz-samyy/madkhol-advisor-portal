import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getClientForZakat } from "@/lib/data";
import { ZakatCalculator } from "@/components/differentiators/ZakatCalculator";

export default async function ZakatClientPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const { locale, clientId } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const client = await getClientForZakat(session.user.advisorId, clientId);
  if (!client) notFound();

  // Aggregate by asset class for the breakdown view
  type Row = { assetClass: string; valueSar: number; zakatable: boolean };
  const breakdownMap = new Map<string, Row>();
  for (const h of client.portfolio?.holdings ?? []) {
    const isZakatable = h.fund.assetClass !== "reit";
    const existing = breakdownMap.get(h.fund.assetClass);
    if (existing) existing.valueSar += h.currentValue;
    else
      breakdownMap.set(h.fund.assetClass, {
        assetClass: h.fund.assetClass,
        valueSar: h.currentValue,
        zakatable: isZakatable,
      });
  }
  const breakdown = Array.from(breakdownMap.values()).sort(
    (a, b) => b.valueSar - a.valueSar,
  );
  const zakatableTotal = breakdown
    .filter((r) => r.zakatable)
    .reduce((s, r) => s + r.valueSar, 0);
  const nonZakatable = breakdown
    .filter((r) => !r.zakatable)
    .reduce((s, r) => s + r.valueSar, 0);

  return (
    <ZakatCalculator
      locale={locale}
      client={{
        id: client.id,
        name: client.name,
        nameAr: client.nameAr,
        hijriYearEndDate: client.hijriYearEndDate.toISOString(),
        totalAum: client.portfolio?.totalAumSar ?? 0,
        zakatableAssets: zakatableTotal,
        nonZakatableAssets: nonZakatable,
      }}
      breakdown={breakdown}
      lastReport={
        client.zakatReports[0]
          ? {
              id: client.zakatReports[0].id,
              hijriYear: client.zakatReports[0].hijriYear,
              zakatDueSar: client.zakatReports[0].zakatDueSar,
              generatedAt: client.zakatReports[0].generatedAt.toISOString(),
            }
          : null
      }
    />
  );
}
