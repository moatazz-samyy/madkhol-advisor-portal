"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";
import { runOptimization } from "@/lib/optimizer/run";
import type {
  OptimizationConfig,
  OptimizationResult,
  OptimizerAssetInput,
} from "@/lib/optimizer/types";

const USD_TO_SAR = 3.75;

/**
 * Run a server-side optimization. Pure compute, no DB. Returned to the client
 * for rendering.
 */
export async function optimize(
  assets: OptimizerAssetInput[],
  config: OptimizationConfig,
): Promise<OptimizationResult> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  return runOptimization(assets, config);
}

// Same upsert path the universal-search actions use.
async function upsertFundForSymbol(symbol: string) {
  const asset = ASSETS_BY_SYMBOL.get(symbol);
  if (!asset) {
    // Already a SAR fund identified by id — try to look it up directly
    const f = await prisma.fund.findUnique({ where: { id: symbol } });
    if (f) return f;
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  const sarNav = asset.lastPrice * USD_TO_SAR;
  const marketCapSar = asset.marketCapUsd * 1_000_000_000 * USD_TO_SAR;
  return prisma.fund.upsert({
    where: { symbol: asset.symbol },
    create: {
      symbol: asset.symbol,
      nameEn: `${asset.symbol} — ${asset.nameEn}`,
      nameAr: `${asset.symbol} — ${asset.nameAr}`,
      assetClass: asset.assetClass === "stock" ? "equity" : asset.assetClass,
      region: asset.region === "us" ? "global" : asset.region,
      sector: asset.sector,
      currency: "USD",
      fundManager: asset.assetClass === "etf" ? "ETF Issuer" : "Listed Equity",
      marketCapSar,
      shariahCompliant: asset.shariahCompliant,
      shariahStatusReason: asset.shariahReason ?? null,
      lastKnownNav: sarNav,
      ytdReturn: asset.ytdReturn,
      fundFeeBps: asset.assetClass === "etf" ? 25 : 0,
    },
    update: {
      lastKnownNav: sarNav,
      ytdReturn: asset.ytdReturn,
      shariahCompliant: asset.shariahCompliant,
    },
  });
}

/**
 * Apply optimized weights to a model portfolio. Replaces the targetHoldings
 * JSON with the new weights, ensuring all referenced funds exist.
 */
export async function applyOptimizedToModel(
  modelId: string,
  weights: { symbol: string; weight: number }[],
): Promise<{ updated: number }> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const model = await prisma.modelPortfolio.findFirst({
    where: { id: modelId, advisorId },
  });
  if (!model) throw new Error("Model not found");

  const targetHoldings: Record<string, number> = {};
  for (const w of weights) {
    const fund = await upsertFundForSymbol(w.symbol);
    targetHoldings[fund.id] = +w.weight.toFixed(2);
  }

  await prisma.modelPortfolio.update({
    where: { id: modelId },
    data: { targetHoldings: JSON.stringify(targetHoldings) },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "model_optimized",
      entityType: "ModelPortfolio",
      entityId: modelId,
      payload: JSON.stringify({
        weightCount: weights.length,
        method: "optimizer",
      }),
    },
  });

  revalidatePath(`/[locale]/models`, "page");
  return { updated: weights.length };
}

/**
 * Apply optimized weights to a client portfolio by computing target-vs-current
 * trades and executing them as a RebalanceJob — same path as the existing
 * Rebalance tool, so transactions, holdings, and audit log all line up.
 */
export async function applyOptimizedToClient(
  clientId: string,
  weights: { symbol: string; weight: number }[],
): Promise<{ trades: number }> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: { portfolio: { include: { holdings: { include: { fund: true } } } } },
  });
  if (!client?.portfolio) throw new Error("Client not found or no portfolio");

  const aum = client.portfolio.totalAumSar;
  const trades: { fundId: string; type: "buy" | "sell"; units: number; amountSar: number }[] =
    [];

  // Build target value per fund
  const targetByFundId = new Map<string, number>();
  for (const w of weights) {
    const fund = await upsertFundForSymbol(w.symbol);
    targetByFundId.set(fund.id, (w.weight / 100) * aum);
  }

  // For every holding we already have, compute delta
  for (const h of client.portfolio.holdings) {
    const target = targetByFundId.get(h.fund.id) ?? 0;
    const delta = target - h.currentValue;
    if (Math.abs(delta) < aum * 0.005) {
      // <0.5% AuM drift — leave alone
      targetByFundId.delete(h.fund.id);
      continue;
    }
    const fund = h.fund;
    const amount = Math.round(Math.abs(delta));
    const units = +(amount / fund.lastKnownNav).toFixed(4);
    trades.push({
      fundId: fund.id,
      type: delta > 0 ? "buy" : "sell",
      units,
      amountSar: amount,
    });
    targetByFundId.delete(h.fund.id);
  }
  // New funds (not previously held) — full BUY of target value
  for (const [fundId, targetValue] of targetByFundId.entries()) {
    if (targetValue <= 0) continue;
    const fund = await prisma.fund.findUnique({ where: { id: fundId } });
    if (!fund) continue;
    const amount = Math.round(targetValue);
    const units = +(amount / fund.lastKnownNav).toFixed(4);
    trades.push({ fundId, type: "buy", units, amountSar: amount });
  }

  // Persist as a RebalanceJob + per-trade transactions
  const job = await prisma.rebalanceJob.create({
    data: {
      advisorId,
      modelId: null,
      affectedClients: 1,
      tradesExecuted: JSON.stringify([{ clientId, trades }]),
    },
  });

  for (const t of trades) {
    await prisma.transaction.create({
      data: {
        portfolioId: client.portfolio.id,
        fundId: t.fundId,
        type: t.type,
        units: t.units,
        amountSar: t.amountSar,
        executedAt: new Date(),
        source: `optimizer_job:${job.id}`,
      },
    });
    const existing = await prisma.holding.findFirst({
      where: { portfolioId: client.portfolio.id, fundId: t.fundId },
    });
    const fund = await prisma.fund.findUnique({ where: { id: t.fundId } });
    if (!fund) continue;
    if (t.type === "buy") {
      if (existing) {
        await prisma.holding.update({
          where: { id: existing.id },
          data: {
            units: existing.units + t.units,
            currentValue: existing.currentValue + t.amountSar,
          },
        });
      } else {
        await prisma.holding.create({
          data: {
            portfolioId: client.portfolio.id,
            fundId: t.fundId,
            units: t.units,
            averageCost: fund.lastKnownNav,
            currentValue: t.amountSar,
          },
        });
      }
    } else {
      if (existing) {
        const newUnits = Math.max(0, existing.units - t.units);
        const newValue = Math.max(0, existing.currentValue - t.amountSar);
        if (newUnits < 0.0001) {
          await prisma.holding.delete({ where: { id: existing.id } });
        } else {
          await prisma.holding.update({
            where: { id: existing.id },
            data: { units: newUnits, currentValue: newValue },
          });
        }
      }
    }
  }

  await prisma.portfolio.update({
    where: { id: client.portfolio.id },
    data: { lastRebalancedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "client_optimized",
      entityType: "Client",
      entityId: clientId,
      payload: JSON.stringify({ tradeCount: trades.length, jobId: job.id }),
    },
  });

  revalidatePath(`/[locale]/clients`, "page");
  revalidatePath(`/[locale]/clients/${clientId}`, "page");
  return { trades: trades.length };
}
