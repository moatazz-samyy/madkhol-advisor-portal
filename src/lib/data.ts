/**
 * Server-side data accessors for the advisor's book.
 * Each function takes the advisor id (from session) and returns plain JSON-safe objects.
 */

import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/format";

export type Locale = "ar" | "en";

// -------- Advisor + KPI summary --------

export async function getBookSummary(advisorId: string) {
  const clients = await prisma.client.findMany({
    where: { advisorId },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
    },
  });

  const onboarded = clients.filter((c) => c.portfolio !== null);
  const totalAum = onboarded.reduce(
    (sum, c) => sum + (c.portfolio?.totalAumSar ?? 0),
    0,
  );
  // Weighted YTD return across all clients' holdings
  let weightedYtdSum = 0;
  for (const c of onboarded) {
    if (!c.portfolio) continue;
    for (const h of c.portfolio.holdings) {
      weightedYtdSum += h.currentValue * (h.fund.ytdReturn / 100);
    }
  }
  const ytdPnlSar = weightedYtdSum;
  const ytdPnlPct = totalAum > 0 ? (ytdPnlSar / totalAum) * 100 : 0;
  // MTD = YTD prorated to ~5 months elapsed in mid-year demo date
  const mtdPnlSar = ytdPnlSar * (1 / 5);
  const mtdPnlPct = ytdPnlPct * (1 / 5);

  return {
    totalAum,
    totalClients: clients.length,
    onboardedClients: onboarded.length,
    pendingClients: clients.length - onboarded.length,
    ytdPnlSar,
    ytdPnlPct,
    mtdPnlSar,
    mtdPnlPct,
  };
}

// -------- Top clients --------

export async function getTopClients(advisorId: string, take = 5) {
  const clients = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
    },
  });

  const ranked = clients
    .map((c) => {
      const aum = c.portfolio?.totalAumSar ?? 0;
      let ytd = 0;
      for (const h of c.portfolio?.holdings ?? []) {
        ytd += h.currentValue * (h.fund.ytdReturn / 100);
      }
      const ytdPct = aum > 0 ? (ytd / aum) * 100 : 0;
      return {
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        aumSar: aum,
        ytdPnlPct: ytdPct,
        joinedAt: c.joinedAt,
      };
    })
    .sort((a, b) => b.aumSar - a.aumSar);

  return ranked.slice(0, take);
}

// -------- Top alerts --------

export type AlertItem = {
  id: string;
  type: "shariahDrift" | "zakatDue" | "zakatOverdue" | "drawdown" | "newClient";
  title: string;
  titleAr: string;
  detail: string;
  detailAr: string;
  href: string;
  at: Date;
};

export async function getTopAlerts(advisorId: string): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];
  const now = new Date();

  // 1. Shariah drift alerts (top 3 unresolved)
  const shariah = await prisma.shariahAlert.findMany({
    where: { advisorId, resolved: false },
    orderBy: { detectedAt: "desc" },
    take: 3,
  });
  for (const a of shariah) {
    const fund = await prisma.fund.findUnique({ where: { id: a.fundId } });
    alerts.push({
      id: `shariah-${a.id}`,
      type: "shariahDrift",
      title: `${fund?.nameEn ?? "Fund"} flagged`,
      titleAr: `${fund?.nameAr ?? "صندوق"} — مراجعة شرعية`,
      detail: `${a.affectedClientCount} clients affected`,
      detailAr: `يؤثر على ${a.affectedClientCount} عميل`,
      href: `/shariah`,
      at: a.detectedAt,
    });
  }

  // 2. Zakat due / overdue (clients with Hijri year-end in ≤30 days or past)
  const clientsWithHijri = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    select: { id: true, name: true, nameAr: true, hijriYearEndDate: true },
  });
  for (const c of clientsWithHijri) {
    const days = daysBetween(now, c.hijriYearEndDate);
    if (days < 0) {
      alerts.push({
        id: `zakat-${c.id}`,
        type: "zakatOverdue",
        title: `Zakat overdue — ${c.name}`,
        titleAr: `زكاة متأخرة — ${c.nameAr}`,
        detail: `${Math.abs(days)} days past Hijri year-end`,
        detailAr: `تجاوزت السنة الهجرية بـ ${Math.abs(days)} يوماً`,
        href: `/clients/${c.id}`,
        at: c.hijriYearEndDate,
      });
    } else if (days <= 30) {
      alerts.push({
        id: `zakat-${c.id}`,
        type: "zakatDue",
        title: `Zakat due in ${days}d — ${c.name}`,
        titleAr: `الزكاة خلال ${days} يوماً — ${c.nameAr}`,
        detail: `Hijri year closing`,
        detailAr: `قرب نهاية السنة الهجرية`,
        href: `/clients/${c.id}`,
        at: c.hijriYearEndDate,
      });
    }
  }

  // 3. New clients in last 30 days
  const newClients = await prisma.client.findMany({
    where: { advisorId, joinedAt: { gte: new Date(now.getTime() - 30 * 86400_000) } },
    orderBy: { joinedAt: "desc" },
    take: 4,
  });
  for (const c of newClients) {
    alerts.push({
      id: `new-${c.id}`,
      type: "newClient",
      title: `New client onboarded — ${c.name}`,
      titleAr: `عميل جديد — ${c.nameAr}`,
      detail: `${daysBetween(c.joinedAt, now)}d ago`,
      detailAr: `قبل ${daysBetween(c.joinedAt, now)} يوماً`,
      href: `/clients/${c.id}`,
      at: c.joinedAt,
    });
  }

  // Sort by recency (most recent / most urgent first) and trim
  alerts.sort((a, b) => b.at.getTime() - a.at.getTime());
  return alerts.slice(0, 8);
}

// -------- Recent activity feed --------

export async function getRecentActivity(advisorId: string, take = 10) {
  const tx = await prisma.transaction.findMany({
    where: { portfolio: { client: { advisorId } } },
    include: {
      portfolio: { include: { client: true } },
      fund: true,
    },
    orderBy: { executedAt: "desc" },
    take,
  });
  return tx.map((t) => ({
    id: t.id,
    type: t.type,
    amountSar: t.amountSar,
    units: t.units,
    fundName: t.fund.nameEn,
    fundNameAr: t.fund.nameAr,
    clientName: t.portfolio.client.name,
    clientNameAr: t.portfolio.client.nameAr,
    clientId: t.portfolio.client.id,
    executedAt: t.executedAt,
  }));
}

// -------- Clients list (with computed columns) --------

export async function getClientsList(advisorId: string) {
  const clients = await prisma.client.findMany({
    where: { advisorId },
    include: {
      portfolio: {
        include: {
          holdings: { include: { fund: true } },
          transactions: {
            orderBy: { executedAt: "desc" },
            take: 1,
            select: { executedAt: true },
          },
        },
      },
    },
  });

  const now = new Date();
  return clients.map((c) => {
    const aum = c.portfolio?.totalAumSar ?? 0;
    let ytd = 0;
    let nonCompliantValue = 0;
    let driftValue = 0;
    let totalHoldingValue = 0;
    for (const h of c.portfolio?.holdings ?? []) {
      ytd += h.currentValue * (h.fund.ytdReturn / 100);
      totalHoldingValue += h.currentValue;
      if (!h.fund.shariahCompliant) nonCompliantValue += h.currentValue;
      if (h.fund.shariahCompliant && h.fund.shariahStatusReason) {
        driftValue += h.currentValue;
      }
    }
    const ytdPct = aum > 0 ? (ytd / aum) * 100 : 0;
    const hijriDays = daysBetween(now, c.hijriYearEndDate);
    const shariahStatus: "compliant" | "drift" | "nonCompliant" =
      nonCompliantValue / Math.max(totalHoldingValue, 1) > 0.05
        ? "nonCompliant"
        : driftValue > 0
        ? "drift"
        : "compliant";

    return {
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      status: c.status,
      aumSar: aum,
      ytdPnlPct: ytdPct,
      lastActivityAt:
        c.portfolio?.transactions[0]?.executedAt ?? c.joinedAt,
      joinedAt: c.joinedAt,
      shariahStatus,
      hijriDaysLeft: hijriDays,
      isNew: daysBetween(c.joinedAt, now) <= 30,
    };
  });
}

// -------- Client detail --------

// -------- Phase 2: tools data --------

export async function getAdvisorFunds() {
  return prisma.fund.findMany({
    orderBy: [{ shariahCompliant: "desc" }, { fundManager: "asc" }, { nameEn: "asc" }],
  });
}

export async function getEligibleClientsForAllocation(advisorId: string) {
  const clients = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    include: {
      portfolio: {
        include: { holdings: { include: { fund: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    aumSar: c.portfolio?.totalAumSar ?? 0,
    holdingsCount: c.portfolio?.holdings.length ?? 0,
    portfolioId: c.portfolio?.id ?? "",
    // Map of fundId → currentValue, for "resulting weight" preview
    fundValues: Object.fromEntries(
      (c.portfolio?.holdings ?? []).map((h) => [h.fundId, h.currentValue]),
    ),
  }));
}

export async function getAdvisorModels(advisorId: string) {
  const models = await prisma.modelPortfolio.findMany({
    where: { advisorId },
    orderBy: { name: "asc" },
  });
  // Count clients per model
  const usage = await prisma.portfolio.groupBy({
    by: ["targetModelId"],
    where: { targetModelId: { not: null }, client: { advisorId } },
    _count: { _all: true },
  });
  const usageMap = new Map(usage.map((u) => [u.targetModelId, u._count._all]));

  return models.map((m) => {
    const targets = JSON.parse(m.targetHoldings) as Record<string, number>;
    return {
      id: m.id,
      name: m.name,
      nameAr: m.nameAr,
      description: m.description,
      holdingsCount: Object.keys(targets).length,
      clientsCount: usageMap.get(m.id) ?? 0,
      targetHoldings: targets,
    };
  });
}

export async function getModelById(advisorId: string, modelId: string) {
  const m = await prisma.modelPortfolio.findFirst({
    where: { id: modelId, advisorId },
  });
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    nameAr: m.nameAr,
    description: m.description,
    targetHoldings: JSON.parse(m.targetHoldings) as Record<string, number>,
  };
}

// -------- Phase 3: differentiators data --------

export async function getShariahOverview(advisorId: string) {
  // Aggregate compliance across the book + open alerts + replacements catalog
  const clients = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
    },
  });

  let totalAum = 0;
  let nonCompliantAum = 0;
  type PerClient = {
    id: string;
    name: string;
    nameAr: string;
    nonCompliantSar: number;
    totalSar: number;
    pctNonCompliant: number;
    flaggedFundIds: string[];
  };
  const perClient: PerClient[] = [];

  for (const c of clients) {
    const holdings = c.portfolio?.holdings ?? [];
    const total = holdings.reduce((s, h) => s + h.currentValue, 0);
    const nc = holdings
      .filter((h) => !h.fund.shariahCompliant)
      .reduce((s, h) => s + h.currentValue, 0);
    totalAum += total;
    nonCompliantAum += nc;
    perClient.push({
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      nonCompliantSar: nc,
      totalSar: total,
      pctNonCompliant: total > 0 ? (nc / total) * 100 : 0,
      flaggedFundIds: holdings.filter((h) => !h.fund.shariahCompliant).map((h) => h.fund.id),
    });
  }

  const compliantPct = totalAum > 0 ? ((totalAum - nonCompliantAum) / totalAum) * 100 : 100;

  const alerts = await prisma.shariahAlert.findMany({
    where: { advisorId },
    orderBy: [{ resolved: "asc" }, { detectedAt: "desc" }],
  });
  const fundIds = [...new Set(alerts.map((a) => a.fundId))];
  const funds = await prisma.fund.findMany({ where: { id: { in: fundIds } } });
  const fundMap = new Map(funds.map((f) => [f.id, f]));

  const alertsHydrated = alerts.map((a) => {
    const f = fundMap.get(a.fundId);
    return {
      id: a.id,
      fundId: a.fundId,
      fundName: f?.nameEn ?? "—",
      fundNameAr: f?.nameAr ?? "—",
      fundManager: f?.fundManager ?? "",
      assetClass: f?.assetClass ?? "etf",
      reason: a.reason,
      shariahStatusReason: f?.shariahStatusReason ?? null,
      detectedAt: a.detectedAt,
      affectedClientCount: a.affectedClientCount,
      resolved: a.resolved,
    };
  });

  const affectedClientCount = perClient.filter((p) => p.nonCompliantSar > 0).length;

  return {
    totalAum,
    nonCompliantAum,
    compliantPct,
    openAlerts: alertsHydrated.filter((a) => !a.resolved).length,
    affectedClientCount,
    alerts: alertsHydrated,
    perClient: perClient.sort((a, b) => b.nonCompliantSar - a.nonCompliantSar),
  };
}

export async function getShariahReplacements(fundId: string) {
  const fund = await prisma.fund.findUnique({ where: { id: fundId } });
  if (!fund) return [];
  // Suggest same asset class + region, Shariah compliant, ordered by similar fee
  const reps = await prisma.fund.findMany({
    where: {
      shariahCompliant: true,
      assetClass: fund.assetClass,
      id: { not: fund.id },
    },
    orderBy: [{ ytdReturn: "desc" }],
    take: 6,
  });
  // Fallback: relax region constraint already implicit; if empty, expand to any class
  return reps;
}

export async function getShariahAffectedClients(advisorId: string, fundId: string) {
  const holdings = await prisma.holding.findMany({
    where: {
      fundId,
      portfolio: { client: { advisorId } },
    },
    include: { portfolio: { include: { client: true } } },
  });
  return holdings.map((h) => ({
    clientId: h.portfolio.client.id,
    clientName: h.portfolio.client.name,
    clientNameAr: h.portfolio.client.nameAr,
    exposureSar: h.currentValue,
    exposurePct:
      h.portfolio.totalAumSar > 0
        ? (h.currentValue / h.portfolio.totalAumSar) * 100
        : 0,
  }));
}

export async function getZakatQueue(advisorId: string) {
  const clients = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
      zakatReports: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });
  const now = new Date();
  const enriched = clients.map((c) => {
    const days = daysBetween(now, c.hijriYearEndDate);
    const aum = c.portfolio?.totalAumSar ?? 0;
    // Zakatable: equity + sukuk + mmf + commodities + etf; exclude REIT (treated as fixed asset for demo)
    let zakatable = 0;
    let nonZakatable = 0;
    for (const h of c.portfolio?.holdings ?? []) {
      if (h.fund.assetClass === "reit") nonZakatable += h.currentValue;
      else zakatable += h.currentValue;
    }
    return {
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      hijriYearEndDate: c.hijriYearEndDate,
      hijriDaysLeft: days,
      totalAum: aum,
      zakatableAssets: zakatable,
      nonZakatableAssets: nonZakatable,
      zakatDue: zakatable * 0.025,
      hasReport: c.zakatReports.length > 0,
      lastReportAt: c.zakatReports[0]?.generatedAt ?? null,
    };
  });
  return enriched
    .filter((c) => c.hijriDaysLeft <= 60)
    .sort((a, b) => a.hijriDaysLeft - b.hijriDaysLeft);
}

export async function getClientForZakat(advisorId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
      zakatReports: { orderBy: { generatedAt: "desc" } },
    },
  });
  return client;
}

export async function getClientForPlanning(advisorId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
    },
  });
  return client;
}

export async function getAdvisorClientsBrief(advisorId: string) {
  const clients = await prisma.client.findMany({
    where: { advisorId, portfolio: { isNot: null } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      familyStructure: true,
      portfolio: { select: { totalAumSar: true } },
      monthlyExpenseSar: true,
      expectedRetireAge: true,
    },
    orderBy: { name: "asc" },
  });
  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    aumSar: c.portfolio?.totalAumSar ?? 0,
    monthlyExpenseSar: c.monthlyExpenseSar,
    expectedRetireAge: c.expectedRetireAge,
    familyStructure: JSON.parse(c.familyStructure) as {
      spouse?: boolean;
      sons?: number;
      daughters?: number;
      fatherAlive?: boolean;
      motherAlive?: boolean;
    },
  }));
}

// -------- Client detail --------

export async function getClientDetail(advisorId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: {
      portfolio: {
        include: {
          holdings: { include: { fund: true } },
          transactions: {
            include: { fund: true },
            orderBy: { executedAt: "desc" },
          },
        },
      },
      notes: { orderBy: { createdAt: "desc" } },
      zakatReports: { orderBy: { generatedAt: "desc" } },
    },
  });
  return client;
}
