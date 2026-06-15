"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RebalanceTrade = {
  fundId: string;
  type: "buy" | "sell";
  units: number;
  amountSar: number;
};

export type RebalancePerClient = {
  clientId: string;
  trades: RebalanceTrade[];
};

export type ExecuteRebalanceInput = {
  modelId: string | null;
  perClient: RebalancePerClient[];
};

export async function executeRebalance(input: ExecuteRebalanceInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const clientIds = input.perClient.map((p) => p.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, advisorId },
    include: { portfolio: { include: { holdings: true } } },
  });
  if (clients.length !== clientIds.length) throw new Error("Client mismatch");

  const job = await prisma.rebalanceJob.create({
    data: {
      advisorId,
      modelId: input.modelId,
      affectedClients: input.perClient.length,
      tradesExecuted: JSON.stringify(input.perClient),
    },
  });

  let totalTrades = 0;

  for (const pc of input.perClient) {
    const client = clients.find((c) => c.id === pc.clientId);
    if (!client?.portfolio) continue;

    for (const trade of pc.trades) {
      const fund = await prisma.fund.findUnique({ where: { id: trade.fundId } });
      if (!fund) continue;

      await prisma.transaction.create({
        data: {
          portfolioId: client.portfolio.id,
          fundId: trade.fundId,
          type: trade.type,
          units: trade.units,
          amountSar: trade.amountSar,
          executedAt: new Date(),
          source: `rebalance_job:${job.id}`,
        },
      });
      totalTrades++;

      // Update holding
      const existing = await prisma.holding.findFirst({
        where: { portfolioId: client.portfolio.id, fundId: trade.fundId },
      });
      if (trade.type === "buy") {
        if (existing) {
          const newUnits = existing.units + trade.units;
          const newValue = existing.currentValue + trade.amountSar;
          const newAvgCost =
            (existing.averageCost * existing.units + fund.lastKnownNav * trade.units) /
            Math.max(newUnits, 0.0001);
          await prisma.holding.update({
            where: { id: existing.id },
            data: { units: newUnits, currentValue: newValue, averageCost: newAvgCost },
          });
        } else {
          await prisma.holding.create({
            data: {
              portfolioId: client.portfolio.id,
              fundId: trade.fundId,
              units: trade.units,
              averageCost: fund.lastKnownNav,
              currentValue: trade.amountSar,
            },
          });
        }
      } else {
        // sell
        if (existing) {
          const newUnits = Math.max(0, existing.units - trade.units);
          const newValue = Math.max(0, existing.currentValue - trade.amountSar);
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

    if (input.modelId) {
      await prisma.portfolio.update({
        where: { id: client.portfolio.id },
        data: { targetModelId: input.modelId, lastRebalancedAt: new Date() },
      });
    } else {
      await prisma.portfolio.update({
        where: { id: client.portfolio.id },
        data: { lastRebalancedAt: new Date() },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "rebalance_executed",
      entityType: "RebalanceJob",
      entityId: job.id,
      payload: JSON.stringify({
        modelId: input.modelId,
        clientCount: input.perClient.length,
        tradeCount: totalTrades,
      }),
    },
  });

  revalidatePath(`/[locale]/dashboard`, "page");
  revalidatePath(`/[locale]/clients`, "page");

  return { jobId: job.id, tradeCount: totalTrades, clientCount: input.perClient.length };
}
