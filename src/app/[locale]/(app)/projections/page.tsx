import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveSubject } from "@/lib/projections/resolve";
import { ProjectionsView } from "@/components/projections/ProjectionsView";
import type { SubjectType } from "@/lib/projections/types";

export default async function ProjectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ subject?: string; id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const subjectType = (sp.subject ?? "client_portfolio") as SubjectType;
  const subjectId = sp.id;

  const subject = subjectId
    ? await resolveSubject(session.user.advisorId, subjectType, subjectId)
    : null;

  const history = subjectId
    ? await prisma.projectionRun.findMany({
        where: {
          advisorId: session.user.advisorId,
          subjectType,
          subjectId,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  return (
    <ProjectionsView
      locale={locale}
      subjectType={subjectType}
      subjectId={subjectId ?? null}
      subject={subject}
      history={history.map((h) => ({
        id: h.id,
        horizonMonths: h.horizonMonths,
        confidenceInterval: h.confidenceInterval,
        monthlyContribution: h.monthlyContribution,
        monthlyWithdrawal: h.monthlyWithdrawal,
        seed: h.seed,
        startingAumSar: h.startingAumSar,
        percentileResults: h.percentileResults,
        aggregates: h.aggregates,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  );
}
