import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSETS, ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";
import type { OptimizerAssetInput } from "@/lib/optimizer/types";
import type { GicsSector } from "@/lib/universal-search/types";
import { OptimizerView } from "@/components/optimizer/OptimizerView";

type SourceKind = "search" | "model" | "client";

type ResolvedSource = {
  kind: SourceKind;
  label: string;
  labelAr: string;
  id?: string;
  assets: OptimizerAssetInput[];
};

async function resolveSource(
  advisorId: string,
  searchParams: { source?: string; symbols?: string; id?: string },
): Promise<ResolvedSource | null> {
  const kind = (searchParams.source as SourceKind | undefined) ?? "search";

  if (kind === "search") {
    const symbols = (searchParams.symbols ?? "").split(",").filter(Boolean);
    const assets = symbols
      .map((s) => ASSETS_BY_SYMBOL.get(s))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map(asUniverseToInput);
    return {
      kind,
      label: "Selection from search",
      labelAr: "تحديد من البحث",
      assets,
    };
  }

  if (kind === "model" && searchParams.id) {
    const m = await prisma.modelPortfolio.findFirst({
      where: { id: searchParams.id, advisorId },
    });
    if (!m) return null;
    const targets = JSON.parse(m.targetHoldings) as Record<string, number>;
    const funds = await prisma.fund.findMany({
      where: { id: { in: Object.keys(targets) } },
    });
    const assets: OptimizerAssetInput[] = funds.map((f) => ({
      symbol: f.symbol ?? f.id,
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      sector: (f.sector ?? "diversified") as GicsSector,
      shariahCompliant: f.shariahCompliant,
      marketCapUsd: f.marketCapSar ? f.marketCapSar / 3_750_000_000 : 50, // back to USD billions
      currentWeight: targets[f.id],
    }));
    return { kind, label: m.name, labelAr: m.nameAr, id: m.id, assets };
  }

  if (kind === "client" && searchParams.id) {
    const c = await prisma.client.findFirst({
      where: { id: searchParams.id, advisorId },
      include: {
        portfolio: { include: { holdings: { include: { fund: true } } } },
      },
    });
    if (!c?.portfolio) return null;
    const totalValue = c.portfolio.totalAumSar || 1;
    const assets: OptimizerAssetInput[] = c.portfolio.holdings.map((h) => ({
      symbol: h.fund.symbol ?? h.fund.id,
      nameEn: h.fund.nameEn,
      nameAr: h.fund.nameAr,
      sector: (h.fund.sector ?? "diversified") as GicsSector,
      shariahCompliant: h.fund.shariahCompliant,
      marketCapUsd: h.fund.marketCapSar ? h.fund.marketCapSar / 3_750_000_000 : 50,
      currentWeight: +((h.currentValue / totalValue) * 100).toFixed(2),
    }));
    return { kind, label: c.name, labelAr: c.nameAr, id: c.id, assets };
  }

  return null;
}

function asUniverseToInput(a: (typeof ASSETS)[number]): OptimizerAssetInput {
  return {
    symbol: a.symbol,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    sector: a.sector,
    shariahCompliant: a.shariahCompliant,
    marketCapUsd: a.marketCapUsd,
  };
}

export default async function OptimizerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string; symbols?: string; id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const source = await resolveSource(session.user.advisorId, sp);

  return (
    <OptimizerView
      locale={locale}
      source={
        source ?? {
          kind: "search",
          label: "Manual selection",
          labelAr: "تحديد يدوي",
          assets: [],
        }
      }
    />
  );
}
