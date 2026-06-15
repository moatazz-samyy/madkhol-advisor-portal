"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ModelInput = {
  id?: string;
  name: string;
  nameAr: string;
  description: string;
  targetHoldings: Record<string, number>; // fundId → weight%
};

export async function saveModel(input: ModelInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const total = Object.values(input.targetHoldings).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 99) > 0.5) {
    throw new Error("Allocation must equal 99% (1% cash reserve).");
  }

  if (input.id) {
    const existing = await prisma.modelPortfolio.findFirst({
      where: { id: input.id, advisorId },
    });
    if (!existing) throw new Error("Model not found");
    const updated = await prisma.modelPortfolio.update({
      where: { id: input.id },
      data: {
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        targetHoldings: JSON.stringify(input.targetHoldings),
      },
    });
    await prisma.auditLog.create({
      data: {
        advisorId,
        actionType: "model_updated",
        entityType: "ModelPortfolio",
        entityId: updated.id,
        payload: JSON.stringify({ name: input.name }),
      },
    });
    revalidatePath(`/[locale]/models`, "page");
    return updated.id;
  }

  const created = await prisma.modelPortfolio.create({
    data: {
      advisorId,
      name: input.name,
      nameAr: input.nameAr,
      description: input.description,
      targetHoldings: JSON.stringify(input.targetHoldings),
    },
  });
  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "model_created",
      entityType: "ModelPortfolio",
      entityId: created.id,
      payload: JSON.stringify({ name: input.name }),
    },
  });
  revalidatePath(`/[locale]/models`, "page");
  return created.id;
}

export async function deleteModel(modelId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const existing = await prisma.modelPortfolio.findFirst({
    where: { id: modelId, advisorId },
  });
  if (!existing) throw new Error("Model not found");

  // Detach any portfolios using this model
  await prisma.portfolio.updateMany({
    where: { targetModelId: modelId },
    data: { targetModelId: null },
  });
  await prisma.modelPortfolio.delete({ where: { id: modelId } });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "model_deleted",
      entityType: "ModelPortfolio",
      entityId: modelId,
      payload: JSON.stringify({ name: existing.name }),
    },
  });

  revalidatePath(`/[locale]/models`, "page");
}
