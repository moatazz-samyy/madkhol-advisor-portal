"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Language, Message, Specialization } from "@/lib/marketplace/types";

// ─── Profile editor ─────────────────────────────────────────────────────────

export type AdvisorProfileInput = {
  bio: string;
  bioAr: string;
  philosophy: string;
  philosophyAr: string;
  yearsExperience: number;
  photoUrl: string | null;
  specializations: Specialization[];
  languages: Language[];
  feeStructure: string;
  feeBps: number;
  visible: boolean;
};

export async function saveMarketplaceProfile(input: AdvisorProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const existing = await prisma.advisorProfile.findUnique({
    where: { advisorId },
  });

  if (existing) {
    await prisma.advisorProfile.update({
      where: { id: existing.id },
      data: {
        bio: input.bio,
        bioAr: input.bioAr,
        philosophy: input.philosophy,
        philosophyAr: input.philosophyAr,
        yearsExperience: input.yearsExperience,
        photoUrl: input.photoUrl,
        specializations: JSON.stringify(input.specializations),
        languages: JSON.stringify(input.languages),
        feeStructure: input.feeStructure,
        feeBps: input.feeBps,
        visible: input.visible,
      },
    });
  } else {
    await prisma.advisorProfile.create({
      data: {
        advisorId,
        bio: input.bio,
        bioAr: input.bioAr,
        philosophy: input.philosophy,
        philosophyAr: input.philosophyAr,
        yearsExperience: input.yearsExperience,
        photoUrl: input.photoUrl,
        specializations: JSON.stringify(input.specializations),
        languages: JSON.stringify(input.languages),
        feeStructure: input.feeStructure,
        feeBps: input.feeBps,
        visible: input.visible,
        certificationStatus: "pending", // newly-created profiles start pending
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "marketplace_profile_saved",
      entityType: "AdvisorProfile",
      entityId: advisorId,
      payload: JSON.stringify({ visible: input.visible }),
    },
  });

  revalidatePath(`/[locale]/marketplace/profile`, "page");
  revalidatePath(`/[locale]/consumer/marketplace`, "page");
}

// ─── Inquiry actions ────────────────────────────────────────────────────────

async function loadInquiryOwned(inquiryId: string, advisorId: string) {
  const i = await prisma.marketplaceInquiry.findFirst({
    where: { id: inquiryId, advisorId },
  });
  if (!i) throw new Error("Inquiry not found");
  return i;
}

export async function replyToInquiry(inquiryId: string, body: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;
  if (!body.trim()) return;

  const inq = await loadInquiryOwned(inquiryId, advisorId);
  const messages = JSON.parse(inq.messages) as Message[];
  const next: Message = {
    from: "advisor",
    body: body.trim(),
    at: new Date().toISOString(),
  };
  messages.push(next);

  await prisma.marketplaceInquiry.update({
    where: { id: inq.id },
    data: {
      messages: JSON.stringify(messages),
      status: inq.status === "new" ? "replied" : inq.status,
    },
  });

  revalidatePath(`/[locale]/marketplace/inquiries`, "page");
}

export async function scheduleMeeting(inquiryId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const inq = await loadInquiryOwned(inquiryId, advisorId);
  const messages = JSON.parse(inq.messages) as Message[];
  messages.push({
    from: "advisor",
    body:
      "Meeting scheduled — you'll receive a calendar invite within 24 hours. (Demo: real scheduling is Phase 2.)",
    at: new Date().toISOString(),
  });

  await prisma.marketplaceInquiry.update({
    where: { id: inq.id },
    data: { messages: JSON.stringify(messages), status: "booked" },
  });

  revalidatePath(`/[locale]/marketplace/inquiries`, "page");
}

export async function declineInquiry(inquiryId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const inq = await loadInquiryOwned(inquiryId, advisorId);
  const messages = JSON.parse(inq.messages) as Message[];
  messages.push({
    from: "advisor",
    body:
      "Thank you for reaching out — I don't think I'm the best fit for your situation. Best of luck with your investing.",
    at: new Date().toISOString(),
  });

  await prisma.marketplaceInquiry.update({
    where: { id: inq.id },
    data: { messages: JSON.stringify(messages), status: "closed" },
  });

  revalidatePath(`/[locale]/marketplace/inquiries`, "page");
}
