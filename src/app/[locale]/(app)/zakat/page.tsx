import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getZakatQueue } from "@/lib/data";
import { ZakatQueueView } from "@/components/differentiators/ZakatQueueView";

export default async function ZakatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const queue = await getZakatQueue(session.user.advisorId);

  return (
    <ZakatQueueView
      locale={locale}
      queue={queue.map((q) => ({
        ...q,
        hijriYearEndDate: q.hijriYearEndDate.toISOString(),
        lastReportAt: q.lastReportAt ? q.lastReportAt.toISOString() : null,
      }))}
    />
  );
}
