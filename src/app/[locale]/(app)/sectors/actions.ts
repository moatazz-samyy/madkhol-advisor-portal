"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";

const USD_TO_SAR = 3.75;

/**
 * Execute a basket buy on a client's portfolio. Each input row is
 * { symbol, amountSar } — the UI computes the per-stock amounts from the
 * chosen allocation method before calling this action.
 *
 * Reuses the same path the Optimizer's apply-to-client uses: one
 * RebalanceJob row + N Transaction rows + holding upserts + AuM increment +
 * audit log. Sector picker, basket buy, and optimizer all converge on the
 * same audit trail.
 */
export async function executeBasketBuy(
  clientId: string,
  basket: { symbol: string; amountSar: number }[],
  meta: { sector: string; allocationMethod: string; sourceLabel: string },
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: { portfolio: true },
  });
  if (!client?.portfolio) throw new Error("Client or portfolio not found");

  const trades: { fundId: string; symbol: string; amountSar: number; units: number }[] = [];

  for (const row of basket) {
    if (row.amountSar <= 0) continue;
    const asset = ASSETS_BY_SYMBOL.get(row.symbol);
    if (!asset) continue;
    // Skip non-Shariah at the server boundary too — defense in depth
    if (!asset.shariahCompliant) continue;

    const sarNav = asset.lastPrice * USD_TO_SAR;
    const fund = await prisma.fund.upsert({
      where: { symbol: asset.symbol },
      create: {
        symbol: asset.symbol,
        nameEn: `${asset.symbol} — ${asset.nameEn}`,
        nameAr: `${asset.symbol} — ${asset.nameAr}`,
        assetClass: asset.assetClass === "stock" ? "equity" : asset.assetClass,
        region: "global",
        sector: asset.sector,
        currency: "USD",
        fundManager: "Listed Equity",
        marketCapSar: asset.marketCapUsd * 1_000_000_000 * USD_TO_SAR,
        shariahCompliant: true,
        lastKnownNav: sarNav,
        ytdReturn: asset.ytdReturn,
        fundFeeBps: 0,
      },
      update: { lastKnownNav: sarNav, ytdReturn: asset.ytdReturn },
    });

    const amount = Math.round(row.amountSar);
    const units = +(amount / sarNav).toFixed(4);
    trades.push({ fundId: fund.id, symbol: asset.symbol, amountSar: amount, units });
  }

  if (trades.length === 0) {
    throw new Error("Basket resolved to zero executable trades.");
  }

  // Persist a RebalanceJob for grouping (matches Optimizer's apply-to-client)
  const job = await prisma.rebalanceJob.create({
    data: {
      advisorId,
      modelId: null,
      affectedClients: 1,
      tradesExecuted: JSON.stringify([{ clientId, trades }]),
    },
  });

  let totalSpent = 0;
  for (const t of trades) {
    await prisma.transaction.create({
      data: {
        portfolioId: client.portfolio.id,
        fundId: t.fundId,
        type: "buy",
        units: t.units,
        amountSar: t.amountSar,
        executedAt: new Date(),
        source: `basket_buy:${meta.sector}:${job.id}`,
      },
    });
    const existing = await prisma.holding.findFirst({
      where: { portfolioId: client.portfolio.id, fundId: t.fundId },
    });
    const fund = await prisma.fund.findUnique({ where: { id: t.fundId } });
    if (!fund) continue;
    if (existing) {
      const newUnits = existing.units + t.units;
      const newValue = existing.currentValue + t.amountSar;
      const newAvgCost =
        (existing.averageCost * existing.units + fund.lastKnownNav * t.units) /
        Math.max(newUnits, 0.0001);
      await prisma.holding.update({
        where: { id: existing.id },
        data: { units: newUnits, currentValue: newValue, averageCost: newAvgCost },
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
    totalSpent += t.amountSar;
  }

  await prisma.portfolio.update({
    where: { id: client.portfolio.id },
    data: { totalAumSar: { increment: totalSpent } },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "basket_buy_executed",
      entityType: "RebalanceJob",
      entityId: job.id,
      payload: JSON.stringify({
        clientId,
        sector: meta.sector,
        allocationMethod: meta.allocationMethod,
        sourceLabel: meta.sourceLabel,
        tradeCount: trades.length,
        totalSpentSar: totalSpent,
        symbols: trades.map((t) => t.symbol),
      }),
    },
  });

  revalidatePath(`/[locale]/clients`, "page");
  revalidatePath(`/[locale]/clients/${clientId}`, "page");
  revalidatePath(`/[locale]/sectors`, "page");
  return {
    jobId: job.id,
    tradeCount: trades.length,
    totalSpentSar: totalSpent,
  };
}
