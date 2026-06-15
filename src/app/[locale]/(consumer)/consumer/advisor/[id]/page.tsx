import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAdvisorProfileById } from "@/lib/marketplace/data";
import { ConsumerAdvisorProfile } from "@/components/marketplace/consumer/ConsumerAdvisorProfile";

export default async function ConsumerAdvisorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const profile = await getAdvisorProfileById(id);
  if (!profile) notFound();
  return <ConsumerAdvisorProfile locale={locale} profile={profile} />;
}
