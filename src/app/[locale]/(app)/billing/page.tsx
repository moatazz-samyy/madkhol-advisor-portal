import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getAdvisorClientsBrief } from "@/lib/data";
import { BillingView } from "@/components/operational/BillingView";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const clients = await getAdvisorClientsBrief(session.user.advisorId);

  return (
    <BillingView
      locale={locale}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        aumSar: c.aumSar,
      }))}
    />
  );
}
