/**
 * Per-advisor Search preferences — column visibility + customize-panel range
 * filters. Persisted in Advisor.preferences (JSON column).
 *
 * The blob lives under the "search" key so other features can claim their own
 * keys later (e.g. "sectors", "clients") without conflicts.
 */

import { prisma } from "@/lib/prisma";
import {
  ALL_OPTIONAL_COLUMNS,
  DEFAULT_COLUMNS,
  type ColumnKey,
  type RangeFilters,
} from "./types";

export type SearchPreferences = {
  columns: ColumnKey[];
  ranges: RangeFilters;
};

export const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  columns: DEFAULT_COLUMNS,
  ranges: {},
};

const VALID_COLUMNS = new Set<ColumnKey>(ALL_OPTIONAL_COLUMNS);

function sanitize(raw: unknown): SearchPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_SEARCH_PREFERENCES;
  const obj = raw as Record<string, unknown>;
  const cols = Array.isArray(obj.columns)
    ? obj.columns.filter((c): c is ColumnKey =>
        typeof c === "string" && VALID_COLUMNS.has(c as ColumnKey),
      )
    : DEFAULT_COLUMNS;
  const ranges =
    obj.ranges && typeof obj.ranges === "object"
      ? (obj.ranges as RangeFilters)
      : {};
  return { columns: cols.length > 0 ? cols : DEFAULT_COLUMNS, ranges };
}

export async function getSearchPreferences(
  advisorId: string,
): Promise<SearchPreferences> {
  const advisor = await prisma.advisor.findUnique({
    where: { id: advisorId },
    select: { preferences: true },
  });
  if (!advisor) return DEFAULT_SEARCH_PREFERENCES;
  try {
    const parsed = JSON.parse(advisor.preferences || "{}");
    return sanitize(parsed.search);
  } catch {
    return DEFAULT_SEARCH_PREFERENCES;
  }
}

export async function setSearchPreferences(
  advisorId: string,
  next: SearchPreferences,
): Promise<void> {
  const advisor = await prisma.advisor.findUnique({
    where: { id: advisorId },
    select: { preferences: true },
  });
  let blob: Record<string, unknown> = {};
  try {
    blob = JSON.parse(advisor?.preferences || "{}");
  } catch {
    blob = {};
  }
  blob.search = sanitize(next);
  await prisma.advisor.update({
    where: { id: advisorId },
    data: { preferences: JSON.stringify(blob) },
  });
}
