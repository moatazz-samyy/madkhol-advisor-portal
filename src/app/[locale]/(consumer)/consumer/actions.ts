"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Message, ServiceTier } from "@/lib/marketplace/types";

/**
 * Consumer-facing — no auth required. Anyone visiting an advisor's public
 * profile can submit a meeting request. The inquiry lands on the advisor's
 * `/marketplace/inquiries` queue inside the portal.
 *
 * The relationship between an advisor and a retail user is contractual; the
 * marketplace just makes the introduction (see README's "Marketplace fee +
 * liability" section). Madkhol takes 0.10–0.20% of the advisor's AuM fee
 * downstream — see src/lib/marketplace/config.ts.
 */
export async function createInquiry(input: {
  advisorProfileId: string;
  userName: string;
  userEmail: string;
  selectedTier: ServiceTier;
  topic: string;
}): Promise<{ id: string }> {
  const profile = await prisma.advisorProfile.findFirst({
    where: {
      id: input.advisorProfileId,
      certificationStatus: "certified",
      visible: true,
    },
  });
  if (!profile) throw new Error("Advisor profile not found or not visible.");

  // Seed the message thread with the user's initial topic
  const firstMessage: Message = {
    from: "user",
    body: input.topic.trim(),
    at: new Date().toISOString(),
  };

  const inquiry = await prisma.marketplaceInquiry.create({
    data: {
      advisorProfileId: profile.id,
      advisorId: profile.advisorId,
      userName: input.userName.trim(),
      userEmail: input.userEmail.trim().toLowerCase(),
      selectedTier: input.selectedTier,
      topic: input.topic.trim(),
      status: "new",
      messages: JSON.stringify([firstMessage]),
    },
  });

  // Audit log via the advisor's account so it shows up in their audit trail
  await prisma.auditLog.create({
    data: {
      advisorId: profile.advisorId,
      actionType: "marketplace_inquiry_received",
      entityType: "MarketplaceInquiry",
      entityId: inquiry.id,
      payload: JSON.stringify({
        userEmail: input.userEmail,
        selectedTier: input.selectedTier,
      }),
    },
  });

  revalidatePath(`/[locale]/marketplace/inquiries`, "page");
  revalidatePath(`/[locale]/dashboard`, "page");
  return { id: inquiry.id };
}
