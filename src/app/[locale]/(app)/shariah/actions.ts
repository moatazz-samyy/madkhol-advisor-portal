"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getShariahReplacements,
  getShariahAffectedClients,
} from "@/lib/data";

export async function resolveShariahAlert(alertId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;
  const alert = await prisma.shariahAlert.findFirst({
    where: { id: alertId, advisorId },
  });
  if (!alert) throw new Error("Alert not found");
  await prisma.shariahAlert.update({
    where: { id: alertId },
    data: { resolved: true },
  });
  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "shariah_alert_resolved",
      entityType: "ShariahAlert",
      entityId: alertId,
      payload: JSON.stringify({ fundId: alert.fundId }),
    },
  });
  revalidatePath(`/[locale]/shariah`, "page");
  revalidatePath(`/[locale]/dashboard`, "page");
}

export async function loadAlertDetail(fundId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;
  const [replacements, affected] = await Promise.all([
    getShariahReplacements(fundId),
    getShariahAffectedClients(advisorId, fundId),
  ]);
  return {
    replacements: replacements.map((r) => ({
      id: r.id,
      nameEn: r.nameEn,
      nameAr: r.nameAr,
      manager: r.fundManager,
      assetClass: r.assetClass,
      ytdReturn: r.ytdReturn,
      fundFeeBps: r.fundFeeBps,
    })),
    affected,
  };
}
