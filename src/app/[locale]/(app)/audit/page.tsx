import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogView } from "@/components/operational/AuditLogView";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const rows = await prisma.auditLog.findMany({
    where: { advisorId: session.user.advisorId },
    orderBy: { createdAt: "desc" },
    take: 500, // hard ceiling — UI paginates from here
  });

  return (
    <AuditLogView
      locale={locale}
      advisorName={session.user.name ?? ""}
      entries={rows.map((r) => ({
        id: r.id,
        actionType: r.actionType,
        entityType: r.entityType,
        entityId: r.entityId,
        payload: r.payload,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
