import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import {
  getConnection,
  getMockPerformance,
  getEdgePct,
} from "@/lib/madkhol-ai/data";
import { MadkholAiLanding } from "@/components/madkhol-ai/MadkholAiLanding";

export default async function MadkholAiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const connection = await getConnection(session.user.advisorId);

  return (
    <MadkholAiLanding
      locale={locale}
      connection={connection}
      performance={getMockPerformance()}
      edgePct={getEdgePct()}
    />
  );
}
