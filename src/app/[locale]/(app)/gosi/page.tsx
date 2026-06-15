import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorClientsBrief } from "@/lib/data";
import { GosiPlanner } from "@/components/differentiators/GosiPlanner";

export default async function GosiPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { locale } = await params;
  const { client: preselectedClientId } = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const clients = await getAdvisorClientsBrief(session.user.advisorId);

  return (
    <GosiPlanner
      locale={locale}
      clients={clients}
      preselectedClientId={preselectedClientId ?? null}
    />
  );
}
