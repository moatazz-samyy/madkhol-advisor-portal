"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function addNote(clientId: string, body: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const trimmed = body.trim();
  if (!trimmed) return;
  // Verify ownership
  const c = await prisma.client.findFirst({
    where: { id: clientId, advisorId: session.user.advisorId },
    select: { id: true },
  });
  if (!c) throw new Error("Not found");
  await prisma.clientNote.create({ data: { clientId, body: trimmed } });
  revalidatePath(`/[locale]/clients/${clientId}`, "page");
}

export async function deleteNote(noteId: string, clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const c = await prisma.client.findFirst({
    where: { id: clientId, advisorId: session.user.advisorId },
    select: { id: true },
  });
  if (!c) throw new Error("Not found");
  await prisma.clientNote.delete({ where: { id: noteId } });
  revalidatePath(`/[locale]/clients/${clientId}`, "page");
}
