"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AllocationBreakdown = {
  clientId: string;
  amountSar: number;
  units: number;
  resultingWeight: number;
};

export type ExecuteAllocationInput = {
  fundId: string;
  algorithm: "pro_rata_aum" | "pro_rata_target" | "equal_sar";
  totalAmountSar: number;
  breakdown: AllocationBreakdown[];
};

export async function executeAllocation(input: ExecuteAllocationInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  // Verify the fund exists and clients all belong to this advisor
  const fund = await prisma.fund.findUnique({ where: { id: input.fundId } });
  if (!fund) throw new Error("Fund not found");

  const clientIds = input.breakdown.map((b) => b.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, advisorId },
    include: { portfolio: true },
  });
  if (clients.length !== clientIds.length) throw new Error("Client mismatch");

  const order = await prisma.allocationOrder.create({
    data: {
      advisorId,
      fundId: input.fundId,
      algorithm: input.algorithm,
      totalAmountSar: input.totalAmountSar,
      perClientBreakdown: JSON.stringify(input.breakdown),
    },
  });

  // Create one BUY transaction per client, update portfolio aum, upsert holdings
  for (const row of input.breakdown) {
    const client = clients.find((c) => c.id === row.clientId);
    if (!client?.portfolio) continue;

    await prisma.transaction.create({
      data: {
        portfolioId: client.portfolio.id,
        fundId: input.fundId,
        type: "buy",
        units: row.units,
        amountSar: row.amountSar,
        executedAt: new Date(),
        source: `allocation_order:${order.id}`,
      },
    });

    // Upsert holding
    const existing = await prisma.holding.findFirst({
      where: { portfolioId: client.portfolio.id, fundId: input.fundId },
    });
    if (existing) {
      const newUnits = existing.units + row.units;
      const newValue = existing.currentValue + row.amountSar;
      const newAvgCost =
        (existing.averageCost * existing.units + fund.lastKnownNav * row.units) /
        Math.max(newUnits, 0.0001);
      await prisma.holding.update({
        where: { id: existing.id },
        data: { units: newUnits, currentValue: newValue, averageCost: newAvgCost },
      });
    } else {
      await prisma.holding.create({
        data: {
          portfolioId: client.portfolio.id,
          fundId: input.fundId,
          units: row.units,
          averageCost: fund.lastKnownNav,
          currentValue: row.amountSar,
        },
      });
    }

    await prisma.portfolio.update({
      where: { id: client.portfolio.id },
      data: { totalAumSar: { increment: row.amountSar } },
    });
  }

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "allocation_order_executed",
      entityType: "AllocationOrder",
      entityId: order.id,
      payload: JSON.stringify({
        fundId: input.fundId,
        totalAmountSar: input.totalAmountSar,
        clientCount: input.breakdown.length,
        algorithm: input.algorithm,
      }),
    },
  });

  revalidatePath(`/[locale]/dashboard`, "page");
  revalidatePath(`/[locale]/clients`, "page");

  return { orderId: order.id, transactionCount: input.breakdown.length };
}
