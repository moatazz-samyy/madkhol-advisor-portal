import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorClientsBrief } from "@/lib/data";
import { WhatsappMock } from "@/components/differentiators/WhatsappMock";

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string; preset?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const clients = await getAdvisorClientsBrief(session.user.advisorId);

  return (
    <WhatsappMock
      locale={locale}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
      }))}
      preselectedClientId={sp.client ?? null}
      preset={(sp.preset as "statement" | "zakat" | "rebalance" | undefined) ?? "statement"}
      advisorName={session.user.name ?? ""}
      advisorNameAr={session.user.nameAr ?? ""}
    />
  );
}
