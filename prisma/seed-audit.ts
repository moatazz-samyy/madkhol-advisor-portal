/**
 * Seed plausible AuditLog entries for Saad so the new Audit Log page demos
 * with real content. Each entry references existing seeded entity ids
 * (clients, models, alpaca models, etc.) and covers the action types our
 * actual server actions write.
 *
 * Idempotent: deletes Saad's existing entries first so re-running doesn't
 * accumulate junk over time.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS_BACK_RANGE = 30;
const NOW = Date.now();

function ago(daysAgo: number, hoursOffset = 0) {
  return new Date(NOW - daysAgo * 86_400_000 - hoursOffset * 3_600_000);
}

async function main() {
  const saad = await prisma.advisor.findUnique({
    where: { email: "advisor1@madkhol.com" },
  });
  if (!saad) {
    console.error("Saad not found — run the main seed first.");
    process.exit(1);
  }
  const advisorId = saad.id;

  console.log("→ Clearing Saad's existing audit log entries...");
  await prisma.auditLog.deleteMany({ where: { advisorId } });

  // Pull a few real entity ids so payloads reference seeded data
  const clients = await prisma.client.findMany({ where: { advisorId }, take: 8 });
  const models = await prisma.modelPortfolio.findMany({ where: { advisorId } });

  const entries: Array<{
    actionType: string;
    entityType: string;
    entityId: string;
    payload: object;
    createdAt: Date;
  }> = [];

  // 30 days ago — model creates
  models.forEach((m, i) => {
    entries.push({
      actionType: "model_created",
      entityType: "ModelPortfolio",
      entityId: m.id,
      payload: { name: m.name },
      createdAt: ago(28 - i, 2),
    });
  });

  // 25-27 days ago — clients onboarded
  clients.slice(0, 5).forEach((c, i) => {
    entries.push({
      actionType: "client_added",
      entityType: "Client",
      entityId: c.id,
      payload: { name: c.name, suitabilityScore: c.suitabilityScore },
      createdAt: ago(25 - i, i * 4),
    });
  });

  // 20-22 days ago — first allocation orders
  for (let i = 0; i < 4; i++) {
    entries.push({
      actionType: "allocation_order_executed",
      entityType: "AllocationOrder",
      entityId: `cmq-alloc-${i}`,
      payload: {
        algorithm: i % 2 === 0 ? "pro_rata_aum" : "equal_sar",
        totalAmountSar: 250_000 + i * 100_000,
        clientCount: 8 + i,
      },
      createdAt: ago(22 - i, i * 3),
    });
  }

  // 18 days ago — Shariah alert resolved
  entries.push({
    actionType: "shariah_alert_resolved",
    entityType: "ShariahAlert",
    entityId: "cmq-shariah-1",
    payload: { fundId: "fund-vanguard-allworld", reason: "drift_resolved" },
    createdAt: ago(18, 5),
  });

  // 15-17 days ago — rebalance jobs
  for (let i = 0; i < 3; i++) {
    entries.push({
      actionType: "rebalance_executed",
      entityType: "RebalanceJob",
      entityId: `cmq-rebal-${i}`,
      payload: {
        modelId: models[i % models.length]?.id ?? null,
        clientCount: 5 + i,
        tradeCount: 18 + i * 4,
      },
      createdAt: ago(17 - i, 1),
    });
  }

  // 14 days ago — Zakat reports
  for (let i = 0; i < 3; i++) {
    entries.push({
      actionType: "zakat_report_generated",
      entityType: "ZakatReport",
      entityId: `cmq-zakat-${i}`,
      payload: {
        clientId: clients[i % clients.length].id,
        zakatDueSar: 12_500 + i * 4_000,
      },
      createdAt: ago(14 - i, i * 2),
    });
  }

  // 12 days ago — model optimized + applied
  for (let i = 0; i < 2; i++) {
    entries.push({
      actionType: i === 0 ? "model_optimized" : "client_optimized",
      entityType: i === 0 ? "ModelPortfolio" : "Client",
      entityId: i === 0 ? models[0].id : clients[2].id,
      payload: { method: "mean_variance", riskTolerance: 0.6, weightCount: 5 },
      createdAt: ago(12 - i, 6),
    });
  }

  // 9-10 days ago — basket buys
  for (let i = 0; i < 2; i++) {
    entries.push({
      actionType: "basket_buy_executed",
      entityType: "RebalanceJob",
      entityId: `cmq-basket-${i}`,
      payload: {
        sector: i === 0 ? "tech" : "healthcare",
        allocationMethod: "cap_weighted",
        tradeCount: 5,
        totalSpentSar: 50_000,
      },
      createdAt: ago(10 - i, 3),
    });
  }

  // 7 days ago — Madkhol AI connected (already exists in seed but we cleared)
  entries.push({
    actionType: "madkhol_ai_connected",
    entityType: "Advisor",
    entityId: advisorId,
    payload: { appliedLevel: "suggestions_only" },
    createdAt: ago(7, 4),
  });

  // 4 days ago — projection runs
  for (let i = 0; i < 2; i++) {
    entries.push({
      actionType: "projection_run",
      entityType: "client_portfolio",
      entityId: clients[i].id,
      payload: { horizonMonths: i === 0 ? 60 : 120, medianFinalSar: 1_870_000 + i * 600_000 },
      createdAt: ago(4 - i, i * 3),
    });
  }

  // 2-3 days ago — marketplace inquiries received
  for (let i = 0; i < 3; i++) {
    entries.push({
      actionType: "marketplace_inquiry_received",
      entityType: "MarketplaceInquiry",
      entityId: `cmq-inq-${i}`,
      payload: {
        userEmail: ["mohammed.sabah@example.com", "lulwa.faisal@example.com", "bandar.subaie@example.com"][i],
        selectedTier: ["advice_only", "hybrid", "full_discretionary"][i],
      },
      createdAt: ago(3 - i, 5),
    });
  }

  // 1 day ago — marketplace profile saved
  entries.push({
    actionType: "marketplace_profile_saved",
    entityType: "AdvisorProfile",
    entityId: advisorId,
    payload: { visible: true },
    createdAt: ago(1, 6),
  });

  // Hours ago — recent activity
  entries.push({
    actionType: "model_optimized",
    entityType: "ModelPortfolio",
    entityId: models[1]?.id ?? models[0].id,
    payload: { method: "risk_parity", weightCount: 6 },
    createdAt: ago(0, 2),
  });

  // Insert all
  for (const e of entries) {
    await prisma.auditLog.create({
      data: {
        advisorId,
        actionType: e.actionType,
        entityType: e.entityType,
        entityId: e.entityId,
        payload: JSON.stringify(e.payload),
        createdAt: e.createdAt,
      },
    });
  }

  const counts = {
    total: await prisma.auditLog.count({ where: { advisorId } }),
    types: (await prisma.auditLog.groupBy({
      by: ["actionType"],
      where: { advisorId },
      _count: { _all: true },
    })).length,
  };
  console.log("✓ Audit log seeded:", counts);
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
