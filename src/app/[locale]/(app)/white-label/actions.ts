"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveWhiteLabel(input: {
  logoUrl: string | null;
  brandColor: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.advisor.update({
    where: { id: session.user.advisorId },
    data: {
      logoUrl: input.logoUrl?.trim() || null,
      brandColor: input.brandColor,
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId: session.user.advisorId,
      actionType: "white_label_updated",
      entityType: "Advisor",
      entityId: session.user.advisorId,
      payload: JSON.stringify({
        hasLogo: Boolean(input.logoUrl?.trim()),
        brandColor: input.brandColor,
      }),
    },
  });

  revalidatePath(`/[locale]/white-label`, "page");
}
