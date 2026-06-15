/**
 * Per-advisor Monitor widget preferences — lives under
 * Advisor.preferences.monitor.widgets (same JSON column we use for Search).
 */

import { prisma } from "@/lib/prisma";
import { ALL_WIDGETS, DEFAULT_WIDGETS, type WidgetKey } from "./registry";

export type MonitorPreferences = {
  widgets: WidgetKey[];
};

export const DEFAULT_MONITOR_PREFERENCES: MonitorPreferences = {
  widgets: DEFAULT_WIDGETS,
};

const VALID = new Set<WidgetKey>(ALL_WIDGETS);

function sanitize(raw: unknown): MonitorPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_MONITOR_PREFERENCES;
  const obj = raw as Record<string, unknown>;
  const widgets = Array.isArray(obj.widgets)
    ? obj.widgets.filter((w): w is WidgetKey =>
        typeof w === "string" && VALID.has(w as WidgetKey),
      )
    : DEFAULT_WIDGETS;
  return { widgets };
}

export async function getMonitorPreferences(
  advisorId: string,
): Promise<MonitorPreferences> {
  const advisor = await prisma.advisor.findUnique({
    where: { id: advisorId },
    select: { preferences: true },
  });
  if (!advisor) return DEFAULT_MONITOR_PREFERENCES;
  try {
    const parsed = JSON.parse(advisor.preferences || "{}");
    return sanitize(parsed.monitor);
  } catch {
    return DEFAULT_MONITOR_PREFERENCES;
  }
}

export async function setMonitorPreferences(
  advisorId: string,
  next: MonitorPreferences,
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
  blob.monitor = sanitize(next);
  await prisma.advisor.update({
    where: { id: advisorId },
    data: { preferences: JSON.stringify(blob) },
  });
}
