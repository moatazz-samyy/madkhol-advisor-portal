"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runProjection } from "@/lib/projections/montecarlo";
import { resolveSubject } from "@/lib/projections/resolve";
import type {
  ConfidenceInterval,
  HorizonMonths,
  ProjectionResult,
  SubjectType,
} from "@/lib/projections/types";

const CACHE_TTL_HOURS = 24;

export type RunProjectionInput = {
  subjectType: SubjectType;
  subjectId: string;
  horizonMonths: HorizonMonths;
  monthlyContributionSar: number;
  monthlyWithdrawalSar: number;
  confidenceInterval: ConfidenceInterval;
  seed?: number; // optional — defaults to a deterministic value per scenario
};

function computeSeed(input: RunProjectionInput): number {
  // Deterministic seed = stable hash of the scenario inputs. Lets repeat calls
  // with identical inputs return identical results even before the cache hits.
  const s =
    `${input.subjectType}|${input.subjectId}|${input.horizonMonths}|` +
    `${input.monthlyContributionSar}|${input.monthlyWithdrawalSar}|` +
    `${input.confidenceInterval}`;
  let h = 0x811c9dc5; // FNV-ish
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) & 0x7fffffff; // mask to 31 bits — fits signed INT column
}

export async function runProjectionAction(
  input: RunProjectionInput,
): Promise<{ id: string; result: ProjectionResult; cached: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const seed = input.seed ?? computeSeed(input);

  // Cache lookup — same scenario for the same subject within 24 h returns
  // the previous run instead of recomputing.
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600_000);
  const cached = await prisma.projectionRun.findFirst({
    where: {
      advisorId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      horizonMonths: input.horizonMonths,
      monthlyContribution: input.monthlyContributionSar,
      monthlyWithdrawal: input.monthlyWithdrawalSar,
      confidenceInterval: input.confidenceInterval,
      seed,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "desc" },
  });

  if (cached) {
    return {
      id: cached.id,
      cached: true,
      result: {
        scenario: {
          subjectType: cached.subjectType as SubjectType,
          subjectId: cached.subjectId,
          horizonMonths: cached.horizonMonths as HorizonMonths,
          monthlyContributionSar: cached.monthlyContribution,
          monthlyWithdrawalSar: cached.monthlyWithdrawal,
          confidenceInterval: cached.confidenceInterval as ConfidenceInterval,
          nRuns: cached.nRuns,
          seed: cached.seed,
        },
        percentiles: JSON.parse(cached.percentileResults),
        aggregates: JSON.parse(cached.aggregates),
        assetsUsed: [],
      },
    };
  }

  // Resolve subject → asset inputs
  const subject = await resolveSubject(advisorId, input.subjectType, input.subjectId);
  if (!subject) throw new Error("Subject not found");
  if (subject.assets.length === 0) throw new Error("Subject has no holdings to project.");

  const result = runProjection(subject.assets, {
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    horizonMonths: input.horizonMonths,
    monthlyContributionSar: input.monthlyContributionSar,
    monthlyWithdrawalSar: input.monthlyWithdrawalSar,
    confidenceInterval: input.confidenceInterval,
    nRuns: 10_000,
    seed,
  });

  // Persist (this is what powers the per-portfolio history + cache)
  const persisted = await prisma.projectionRun.create({
    data: {
      advisorId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      horizonMonths: input.horizonMonths,
      monthlyContribution: input.monthlyContributionSar,
      monthlyWithdrawal: input.monthlyWithdrawalSar,
      confidenceInterval: input.confidenceInterval,
      nRuns: 10_000,
      seed,
      startingAumSar: result.aggregates.startingAumSar,
      percentileResults: JSON.stringify(result.percentiles),
      aggregates: JSON.stringify(result.aggregates),
    },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "projection_run",
      entityType: input.subjectType,
      entityId: input.subjectId,
      payload: JSON.stringify({
        horizonMonths: input.horizonMonths,
        medianFinalSar: result.aggregates.medianFinalSar,
      }),
    },
  });

  revalidatePath(`/[locale]/projections`, "page");
  return { id: persisted.id, result, cached: false };
}
