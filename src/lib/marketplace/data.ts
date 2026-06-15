/**
 * Read accessors for the Certified Advisor Marketplace.
 */

import { prisma } from "@/lib/prisma";
import type {
  CertificationStatus,
  InquiryStatus,
  Language,
  Message,
  Specialization,
} from "./types";

// ─── Consumer-side: list certified+visible advisors ─────────────────────────

export type MarketplaceCard = {
  id: string;
  advisorId: string;
  name: string;
  nameAr: string;
  bio: string;
  bioAr: string;
  photoUrl: string | null;
  yearsExperience: number;
  specializations: Specialization[];
  languages: Language[];
  feeBps: number;
  feeStructure: string;
  totalAumSar: number;
  averageClientAumSar: number;
  currentClientCount: number;
};

export async function listCertifiedAdvisors(): Promise<MarketplaceCard[]> {
  const rows = await prisma.advisorProfile.findMany({
    where: { certificationStatus: "certified", visible: true },
    include: { advisor: true },
    orderBy: { totalAumSar: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    advisorId: r.advisorId,
    name: r.advisor.name,
    nameAr: r.advisor.nameAr,
    bio: r.bio,
    bioAr: r.bioAr,
    photoUrl: r.photoUrl,
    yearsExperience: r.yearsExperience,
    specializations: JSON.parse(r.specializations) as Specialization[],
    languages: JSON.parse(r.languages) as Language[],
    feeBps: r.feeBps,
    feeStructure: r.feeStructure,
    totalAumSar: r.totalAumSar,
    averageClientAumSar: r.averageClientAumSar,
    currentClientCount: r.currentClientCount,
  }));
}

// ─── Consumer-side: single advisor profile ──────────────────────────────────

export type MarketplaceProfile = MarketplaceCard & {
  philosophy: string;
  philosophyAr: string;
};

export async function getAdvisorProfileById(
  profileId: string,
): Promise<MarketplaceProfile | null> {
  const r = await prisma.advisorProfile.findFirst({
    where: { id: profileId, certificationStatus: "certified", visible: true },
    include: { advisor: true },
  });
  if (!r) return null;
  return {
    id: r.id,
    advisorId: r.advisorId,
    name: r.advisor.name,
    nameAr: r.advisor.nameAr,
    bio: r.bio,
    bioAr: r.bioAr,
    photoUrl: r.photoUrl,
    yearsExperience: r.yearsExperience,
    specializations: JSON.parse(r.specializations) as Specialization[],
    languages: JSON.parse(r.languages) as Language[],
    feeBps: r.feeBps,
    feeStructure: r.feeStructure,
    totalAumSar: r.totalAumSar,
    averageClientAumSar: r.averageClientAumSar,
    currentClientCount: r.currentClientCount,
    philosophy: r.philosophy,
    philosophyAr: r.philosophyAr,
  };
}

// ─── Advisor-side: get the logged-in advisor's profile (including hidden) ────

export async function getOwnProfile(advisorId: string) {
  const r = await prisma.advisorProfile.findUnique({
    where: { advisorId },
    include: { advisor: true },
  });
  if (!r) return null;
  return {
    id: r.id,
    advisorId: r.advisorId,
    advisorName: r.advisor.name,
    advisorNameAr: r.advisor.nameAr,
    bio: r.bio,
    bioAr: r.bioAr,
    philosophy: r.philosophy,
    philosophyAr: r.philosophyAr,
    yearsExperience: r.yearsExperience,
    photoUrl: r.photoUrl,
    specializations: JSON.parse(r.specializations) as Specialization[],
    languages: JSON.parse(r.languages) as Language[],
    feeStructure: r.feeStructure,
    feeBps: r.feeBps,
    totalAumSar: r.totalAumSar,
    currentClientCount: r.currentClientCount,
    visible: r.visible,
    certificationStatus: r.certificationStatus as CertificationStatus,
    certifiedAt: r.certifiedAt,
  };
}

// ─── Advisor-side: inbound inquiries list ───────────────────────────────────

export type InquiryRow = {
  id: string;
  userName: string;
  userEmail: string;
  selectedTier: string;
  topic: string;
  status: InquiryStatus;
  messages: Message[];
  createdAt: Date;
};

export async function listInquiries(advisorId: string): Promise<InquiryRow[]> {
  const rows = await prisma.marketplaceInquiry.findMany({
    where: { advisorId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    userEmail: r.userEmail,
    selectedTier: r.selectedTier,
    topic: r.topic,
    status: r.status as InquiryStatus,
    messages: JSON.parse(r.messages) as Message[],
    createdAt: r.createdAt,
  }));
}

// ─── Admin: all profiles split by status ────────────────────────────────────

export async function listAllProfilesByStatus() {
  const all = await prisma.advisorProfile.findMany({
    include: { advisor: true, inquiries: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  return all.map((r) => ({
    id: r.id,
    advisorId: r.advisorId,
    advisorName: r.advisor.name,
    advisorNameAr: r.advisor.nameAr,
    licenseNo: r.advisor.licenseNo,
    yearsExperience: r.yearsExperience,
    specializations: JSON.parse(r.specializations) as Specialization[],
    feeBps: r.feeBps,
    totalAumSar: r.totalAumSar,
    currentClientCount: r.currentClientCount,
    visible: r.visible,
    certificationStatus: r.certificationStatus as CertificationStatus,
    certifiedAt: r.certifiedAt,
    inquiryCount: r.inquiries.length,
    internalRating: r.internalRating,
    internalNotes: r.internalNotes,
  }));
}
