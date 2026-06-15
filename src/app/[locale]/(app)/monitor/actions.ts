"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  setMonitorPreferences,
  type MonitorPreferences,
} from "@/lib/monitor/preferences";

export async function saveMonitorPreferences(prefs: MonitorPreferences) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  await setMonitorPreferences(session.user.advisorId, prefs);
  revalidatePath(`/[locale]/monitor`, "page");
  return { ok: true };
}
