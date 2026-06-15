"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CreateClientInput = {
  // Identity
  name: string;
  nameAr: string;
  nationalId: string;
  // Contact
  phone: string;
  email: string;
  // Risk
  suitabilityScore: number;          // 1..100
  // Saudi context
  hijriYearEndIso: string;           // ISO date string, e.g. "2026-12-31"
  expectedRetireAge: number;         // 50..70
  monthlyExpenseSar: number;         // 1000..100000
  startingDepositSar: number;        // ≥ 0
};

export type CreateClientResult = {
  clientId: string;
  kycToken: string;
};

// Reasonably opaque token — 24 chars, URL-safe, deterministic per call. Not a
// security boundary against guessing alone (advisor-issued links are short-
// lived), but the unique constraint plus the cuid() client id make collisions
// effectively impossible. Production should swap to a CSPRNG.
function generateKycToken(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  // Math.random is fine here — the token's only job is to be unguessable to
  // someone who doesn't already have it; real auth still gates everything else.
  for (let i = 0; i < 24; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

const SAUDI_NATIONAL_ID_RE = /^[12]\d{9}$/;
const SAUDI_PHONE_RE = /^(?:\+?966|0)?5\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createClient(
  input: CreateClientInput,
): Promise<CreateClientResult> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  // Boundary validation — input came from the client. Trust nothing.
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Name is required.");
  if (!input.nameAr?.trim()) errors.push("Arabic name is required.");
  if (!SAUDI_NATIONAL_ID_RE.test(input.nationalId.trim())) {
    errors.push("National ID must be 10 digits starting with 1 or 2.");
  }
  if (!SAUDI_PHONE_RE.test(input.phone.replace(/\s/g, ""))) {
    errors.push("Phone must be a Saudi mobile number (e.g. 05XXXXXXXX).");
  }
  if (!EMAIL_RE.test(input.email.trim())) errors.push("Email looks invalid.");
  if (input.suitabilityScore < 1 || input.suitabilityScore > 100) {
    errors.push("Suitability score must be between 1 and 100.");
  }
  if (input.expectedRetireAge < 45 || input.expectedRetireAge > 75) {
    errors.push("Retirement age must be between 45 and 75.");
  }
  if (input.monthlyExpenseSar < 1_000 || input.monthlyExpenseSar > 200_000) {
    errors.push("Monthly expense must be between 1,000 and 200,000 SAR.");
  }
  if (input.startingDepositSar < 0) {
    errors.push("Starting deposit cannot be negative.");
  }
  const hijriDate = new Date(input.hijriYearEndIso);
  if (Number.isNaN(hijriDate.getTime())) {
    errors.push("Hijri year-end date is invalid.");
  }
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  // Uniqueness — National ID + email per advisor (soft guard, friendlier error)
  const dup = await prisma.client.findFirst({
    where: {
      advisorId,
      OR: [
        { nationalId: input.nationalId.trim() },
        { email: input.email.trim().toLowerCase() },
      ],
    },
    select: { id: true, nationalId: true, email: true },
  });
  if (dup) {
    throw new Error(
      dup.nationalId === input.nationalId.trim()
        ? "A client with this National ID already exists in your book."
        : "A client with this email already exists in your book.",
    );
  }

  const kycToken = generateKycToken();

  // Family structure stays empty at onboarding — Mirath planner fills it later.
  const created = await prisma.client.create({
    data: {
      advisorId,
      name: input.name.trim(),
      nameAr: input.nameAr.trim(),
      nationalId: input.nationalId.trim(),
      phone: input.phone.replace(/\s/g, ""),
      email: input.email.trim().toLowerCase(),
      status: "pending_nafath",
      suitabilityScore: Math.round(input.suitabilityScore),
      hijriYearEndDate: hijriDate,
      familyStructure: "{}",
      expectedRetireAge: Math.round(input.expectedRetireAge),
      monthlyExpenseSar: Math.round(input.monthlyExpenseSar),
      kycToken,
      portfolio: {
        create: {
          currency: "SAR",
          totalAumSar: Math.max(0, Math.round(input.startingDepositSar)),
        },
      },
    },
    select: { id: true, kycToken: true },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "client_added",
      entityType: "Client",
      entityId: created.id,
      payload: JSON.stringify({
        name: input.name.trim(),
        suitabilityScore: input.suitabilityScore,
        startingDepositSar: input.startingDepositSar,
      }),
    },
  });

  revalidatePath("/[locale]/clients", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { clientId: created.id, kycToken: created.kycToken ?? kycToken };
}

// ─── KYC submission (called from the public /kyc/<token> page) ──────────────

export type KycSubmissionInput = {
  token: string;
  confirmedNationalId: string;
  confirmedFullName: string;
  acceptedTerms: boolean;
};

export async function submitKyc(input: KycSubmissionInput): Promise<{ ok: true }> {
  if (!input.acceptedTerms) {
    throw new Error("You must accept the terms to submit.");
  }
  const client = await prisma.client.findUnique({
    where: { kycToken: input.token },
    select: { id: true, nationalId: true, name: true, advisorId: true },
  });
  if (!client) {
    throw new Error("This invite has already been used or is invalid.");
  }
  if (client.nationalId !== input.confirmedNationalId.trim()) {
    throw new Error("National ID does not match the advisor's record.");
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      status: "active",
      kycCompletedAt: new Date(),
      kycToken: null, // burn the token so the link only works once
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId: client.advisorId,
      actionType: "client_kyc_completed",
      entityType: "Client",
      entityId: client.id,
      payload: JSON.stringify({
        confirmedName: input.confirmedFullName,
      }),
    },
  });

  revalidatePath(`/[locale]/clients`, "page");
  revalidatePath(`/[locale]/clients/${client.id}`, "page");
  return { ok: true };
}
