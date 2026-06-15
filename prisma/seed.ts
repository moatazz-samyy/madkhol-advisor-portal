/**
 * Madkhol Advisor Portal — demo seed.
 *
 * Builds a coherent story so the CEO can click around without seeing empty states:
 *  - 2 advisors (Saad = advisor1, Sara = advisor2)
 *  - 20 clients (12 + 8), each with diverse archetype + plausible AuM
 *  - 50 funds with real Saudi managers + global ETFs; 7 non-compliant for Shariah demo
 *  - Holdings sized to match each client's archetype + AuM
 *  - 90 days of transactions per client (buys mostly, occasional sells)
 *  - 3 model portfolios per advisor (Conservative / Balanced / Growth)
 *  - 3 Shariah drift alerts, 2 missed Zakat, 1 large drawdown, 4 new-client signals
 *  - Zakat reports for clients whose Hijri year is closing soon
 *
 * Idempotent — wipes child tables and re-inserts.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FUNDS } from "./seed-data/funds";
import { CLIENTS_SAAD, CLIENTS_SARA, type ClientSeed } from "./seed-data/clients";

const prisma = new PrismaClient();

// Deterministic PRNG so every seed run produces the same story.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260609);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const sample = <T>(arr: T[], k: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < k && copy.length; i++) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
};

const HIJRI_NISAB_SAR = 24750; // approx 85g gold at demo price
const NOW = new Date("2026-06-09T08:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400_000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86400_000);

async function wipe() {
  // Order matters — children first.
  await prisma.auditLog.deleteMany();
  await prisma.shariahAlert.deleteMany();
  await prisma.zakatReport.deleteMany();
  await prisma.allocationOrder.deleteMany();
  await prisma.rebalanceJob.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.client.deleteMany();
  await prisma.modelPortfolio.deleteMany();
  await prisma.fund.deleteMany();
  await prisma.advisor.deleteMany();
}

async function seedAdvisors() {
  const passwordHash = await bcrypt.hash("demo123", 8);
  const saad = await prisma.advisor.create({
    data: {
      name: "Saad Al-Otaibi",
      nameAr: "سعد العتيبي",
      email: "advisor1@madkhol.com",
      passwordHash,
      brandColor: "#0A2E1F",
      licenseNo: "CMA-2024-A-1187",
    },
  });
  const sara = await prisma.advisor.create({
    data: {
      name: "Sara Al-Dosari",
      nameAr: "سارة الدوسري",
      email: "advisor2@madkhol.com",
      passwordHash,
      brandColor: "#0A2E1F",
      licenseNo: "CMA-2024-A-1318",
    },
  });
  return { saad, sara };
}

async function seedFunds() {
  for (const f of FUNDS) {
    await prisma.fund.create({ data: f });
  }
  return prisma.fund.findMany();
}

// Archetype -> target allocation (asset class -> weight pct)
function targetAllocation(archetype: ClientSeed["archetype"]) {
  switch (archetype) {
    case "young":         return { equity: 65, etf: 20, sukuk: 5,  mmf: 5,  commodities: 5 };
    case "growth":        return { equity: 55, etf: 20, sukuk: 10, mmf: 5,  commodities: 5, reit: 5 };
    case "balanced":      return { equity: 35, etf: 20, sukuk: 25, mmf: 10, commodities: 5, reit: 5 };
    case "conservative":  return { equity: 15, etf: 15, sukuk: 40, mmf: 20, commodities: 5, reit: 5 };
    case "family_office": return { equity: 30, etf: 25, sukuk: 20, mmf: 5,  commodities: 10, reit: 10 };
  }
}

type FundRow = { id: string; assetClass: string; lastKnownNav: number; shariahCompliant: boolean; nameEn: string };

function buildHoldings(client: ClientSeed, funds: FundRow[]) {
  const target = targetAllocation(client.archetype);
  // Prefer compliant funds; keep one non-compliant for ~25% of clients to drive Shariah demo
  const wantNonCompliant = rng() < 0.25;
  const eligible = funds.filter(f => f.shariahCompliant || wantNonCompliant);

  const holdings: { fundId: string; units: number; averageCost: number; currentValue: number }[] = [];
  for (const [assetClass, weightPct] of Object.entries(target)) {
    const pool = eligible.filter(f => f.assetClass === assetClass);
    if (!pool.length) continue;
    const picked = sample(pool, Math.min(2, pool.length));
    const perFundSar = (client.aumSar * weightPct / 100) / picked.length;
    for (const fund of picked) {
      // SAR-priced funds use NAV directly; USD funds approx-converted at 3.75 SAR/USD
      const navSar = fund.id.includes("usd") ? fund.lastKnownNav * 3.75 : fund.lastKnownNav;
      const units = perFundSar / fund.lastKnownNav;
      const avgCost = fund.lastKnownNav * rand(0.85, 1.02); // some unrealized P&L
      holdings.push({
        fundId: fund.id,
        units: +units.toFixed(4),
        averageCost: +avgCost.toFixed(2),
        currentValue: +perFundSar.toFixed(2),
      });
    }
  }
  // Trim to 5-10 holdings
  const trimmed = holdings.slice(0, Math.min(10, Math.max(5, holdings.length)));
  // Renormalize currentValue to equal aumSar
  const sumCV = trimmed.reduce((s, h) => s + h.currentValue, 0);
  const factor = client.aumSar / sumCV;
  trimmed.forEach(h => { h.currentValue = +(h.currentValue * factor).toFixed(2); });
  return trimmed;
}

async function seedClientsAndPortfolios(
  advisorId: string,
  clients: ClientSeed[],
  funds: FundRow[],
) {
  const ids: string[] = [];
  for (const c of clients) {
    const isNew = c.joinedDaysAgo < 30;
    const status = isNew && rng() < 0.4 ? "pending_nafath" : "active";
    const client = await prisma.client.create({
      data: {
        advisorId,
        name: c.name,
        nameAr: c.nameAr,
        nationalId: c.nationalId,
        phone: c.phone,
        email: c.email,
        status,
        joinedAt: daysAgo(c.joinedDaysAgo),
        suitabilityScore: c.suitability,
        hijriYearEndDate: daysAhead(c.hijriDaysToYearEnd),
        familyStructure: JSON.stringify(c.family),
        expectedRetireAge: c.retireAge,
        monthlyExpenseSar: c.monthlyExpenseSar,
      },
    });
    ids.push(client.id);

    if (status === "pending_nafath") continue; // no portfolio for pending Nafath verification

    const holdings = buildHoldings(c, funds);
    const portfolio = await prisma.portfolio.create({
      data: {
        clientId: client.id,
        currency: "SAR",
        totalAumSar: c.aumSar,
        lastRebalancedAt: daysAgo(randInt(15, 95)),
      },
    });
    await prisma.holding.createMany({
      data: holdings.map(h => ({ ...h, portfolioId: portfolio.id })),
    });

    // 90 days of mock transactions — mostly buys at portfolio inception, then steady contributions
    const txCount = randInt(8, 18);
    for (let i = 0; i < txCount; i++) {
      const days = randInt(2, 90);
      const h = pick(holdings);
      const isBuy = rng() < 0.78;
      const amt = +(rand(2000, 25000)).toFixed(2);
      const fundNav = funds.find(f => f.id === h.fundId)!.lastKnownNav;
      await prisma.transaction.create({
        data: {
          portfolioId: portfolio.id,
          fundId: h.fundId,
          type: isBuy ? "buy" : "sell",
          units: +(amt / fundNav).toFixed(4),
          amountSar: amt,
          executedAt: daysAgo(days),
          source: "manual",
        },
      });
    }

    // 1-2 advisor notes per active client
    const noteSamples = [
      "Client confirmed Q3 lifestyle expense increase due to second child.",
      "Prefers WhatsApp over email for monthly statements.",
      "Asked about Mirath planning at next review.",
      "Considering increasing monthly contribution to 5k SAR.",
      "Risk tolerance reassessed — moved up one notch after Q2 conversation.",
    ];
    const noteCount = randInt(1, 2);
    for (let i = 0; i < noteCount; i++) {
      await prisma.clientNote.create({
        data: {
          clientId: client.id,
          body: pick(noteSamples),
          createdAt: daysAgo(randInt(5, 80)),
        },
      });
    }

    // Zakat report if Hijri year-end has passed or is within 30 days
    if (c.hijriDaysToYearEnd <= 30 && status === "active") {
      const zakatable = c.aumSar * 0.92; // mmf + most equity is zakatable; reit/etc lower
      await prisma.zakatReport.create({
        data: {
          clientId: client.id,
          hijriYear: 1447,
          zakatableAssetsSar: +zakatable.toFixed(2),
          nisabThresholdSar: HIJRI_NISAB_SAR,
          zakatDueSar: +(zakatable * 0.025).toFixed(2),
          generatedAt: c.hijriDaysToYearEnd < 0 ? daysAgo(Math.abs(c.hijriDaysToYearEnd) + 5) : daysAgo(1),
        },
      });
    }
  }
  return ids;
}

async function seedModelPortfolios(advisorId: string, funds: FundRow[]) {
  const compliant = funds.filter(f => f.shariahCompliant);
  const pickByClass = (assetClass: string) => compliant.find(f => f.assetClass === assetClass);

  const conservative = {
    [pickByClass("sukuk")?.id ?? ""]: 40,
    [pickByClass("mmf")?.id ?? ""]: 30,
    [pickByClass("equity")?.id ?? ""]: 15,
    [pickByClass("etf")?.id ?? ""]: 10,
    [pickByClass("commodities")?.id ?? ""]: 4,
  };
  const balanced = {
    [pickByClass("equity")?.id ?? ""]: 35,
    [pickByClass("etf")?.id ?? ""]: 20,
    [pickByClass("sukuk")?.id ?? ""]: 25,
    [pickByClass("mmf")?.id ?? ""]: 10,
    [pickByClass("commodities")?.id ?? ""]: 5,
    [pickByClass("reit")?.id ?? ""]: 4,
  };
  const growth = {
    [pickByClass("equity")?.id ?? ""]: 50,
    [pickByClass("etf")?.id ?? ""]: 25,
    [pickByClass("sukuk")?.id ?? ""]: 10,
    [pickByClass("commodities")?.id ?? ""]: 8,
    [pickByClass("reit")?.id ?? ""]: 6,
  };
  // 1% reserved for cash on all
  await prisma.modelPortfolio.createMany({
    data: [
      { advisorId, name: "Conservative", nameAr: "محافظ", description: "Capital preservation for cautious savers; heavy Sukuk and Murabaha.", targetHoldings: JSON.stringify(conservative) },
      { advisorId, name: "Balanced",     nameAr: "متوازن", description: "Diversified across equity, sukuk, gold for steady real growth.",     targetHoldings: JSON.stringify(balanced) },
      { advisorId, name: "Growth",       nameAr: "نامي",   description: "Equity-heavy for long-horizon clients comfortable with volatility.", targetHoldings: JSON.stringify(growth) },
    ],
  });
}

async function seedAlerts(advisorId: string, funds: FundRow[]) {
  const nonCompliant = funds.filter(f => !f.shariahCompliant);
  // Pick 3 Shariah drift alerts on the freshest-feeling non-compliant funds
  const alertFunds = sample(nonCompliant, Math.min(3, nonCompliant.length));
  for (const f of alertFunds) {
    const affected = await prisma.holding.count({
      where: { fundId: f.id, portfolio: { client: { advisorId } } },
    });
    await prisma.shariahAlert.create({
      data: {
        fundId: f.id,
        advisorId,
        detectedAt: daysAgo(randInt(2, 14)),
        reason: f.id ? (funds.find(x => x.id === f.id) as FundRow & { shariahStatusReason?: string }).nameEn + " — flagged by Shariah board." : "Flagged.",
        affectedClientCount: affected,
        resolved: false,
      },
    });
  }
}

async function main() {
  console.log("→ Wiping existing data...");
  await wipe();

  console.log("→ Seeding advisors...");
  const { saad, sara } = await seedAdvisors();

  console.log("→ Seeding funds...");
  const funds = await seedFunds();
  const fundRows = funds.map(f => ({
    id: f.id,
    assetClass: f.assetClass,
    lastKnownNav: f.lastKnownNav,
    shariahCompliant: f.shariahCompliant,
    nameEn: f.nameEn,
  }));

  console.log("→ Seeding Saad's clients + portfolios...");
  await seedClientsAndPortfolios(saad.id, CLIENTS_SAAD, fundRows);

  console.log("→ Seeding Sara's clients + portfolios...");
  await seedClientsAndPortfolios(sara.id, CLIENTS_SARA, fundRows);

  console.log("→ Seeding model portfolios...");
  await seedModelPortfolios(saad.id, fundRows);
  await seedModelPortfolios(sara.id, fundRows);

  console.log("→ Seeding Shariah alerts...");
  await seedAlerts(saad.id, fundRows);
  await seedAlerts(sara.id, fundRows);

  // Quick sanity print
  const counts = {
    advisors: await prisma.advisor.count(),
    clients: await prisma.client.count(),
    funds: await prisma.fund.count(),
    portfolios: await prisma.portfolio.count(),
    holdings: await prisma.holding.count(),
    transactions: await prisma.transaction.count(),
    models: await prisma.modelPortfolio.count(),
    alerts: await prisma.shariahAlert.count(),
    zakatReports: await prisma.zakatReport.count(),
  };
  console.log("✓ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
