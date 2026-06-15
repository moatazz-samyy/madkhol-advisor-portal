"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EngagementLevel = "suggestions_only" | "auto_execute_below_10k";

export async function connectMadkholAi(level: EngagementLevel) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  // Auto-execute is gated for the demo — accept "suggestions_only" only.
  const safeLevel: EngagementLevel = "suggestions_only";

  await prisma.advisor.update({
    where: { id: advisorId },
    data: {
      madkholAiConnectedAt: new Date(),
      madkholAiEngagementLevel: safeLevel,
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "madkhol_ai_connected",
      entityType: "Advisor",
      entityId: advisorId,
      payload: JSON.stringify({ requestedLevel: level, appliedLevel: safeLevel }),
    },
  });

  revalidatePath(`/[locale]/dashboard`, "page");
  revalidatePath(`/[locale]/madkhol-ai`, "page");
  return { ok: true };
}

export async function disconnectMadkholAi() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  await prisma.advisor.update({
    where: { id: advisorId },
    data: {
      madkholAiConnectedAt: null,
      madkholAiEngagementLevel: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "madkhol_ai_disconnected",
      entityType: "Advisor",
      entityId: advisorId,
      payload: "{}",
    },
  });

  revalidatePath(`/[locale]/dashboard`, "page");
  revalidatePath(`/[locale]/madkhol-ai`, "page");
  return { ok: true };
}
