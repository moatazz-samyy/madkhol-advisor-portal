"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NISAB_SAR = 24750; // demo nisab — based on ~85g gold at demo price

export async function generateZakatReport(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: {
      portfolio: { include: { holdings: { include: { fund: true } } } },
    },
  });
  if (!client) throw new Error("Client not found");

  let zakatable = 0;
  for (const h of client.portfolio?.holdings ?? []) {
    if (h.fund.assetClass !== "reit") zakatable += h.currentValue;
  }
  const zakatDue = Math.max(0, zakatable - NISAB_SAR) > 0 ? zakatable * 0.025 : 0;

  const report = await prisma.zakatReport.create({
    data: {
      clientId,
      hijriYear: 1447,
      zakatableAssetsSar: +zakatable.toFixed(2),
      nisabThresholdSar: NISAB_SAR,
      zakatDueSar: +zakatDue.toFixed(2),
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "zakat_report_generated",
      entityType: "ZakatReport",
      entityId: report.id,
      payload: JSON.stringify({ clientId, zakatDueSar: zakatDue }),
    },
  });

  revalidatePath(`/[locale]/zakat`, "page");
  revalidatePath(`/[locale]/zakat/${clientId}`, "page");
  return { reportId: report.id, zakatDueSar: zakatDue };
}
