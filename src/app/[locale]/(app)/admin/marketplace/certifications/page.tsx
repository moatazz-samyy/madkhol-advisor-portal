import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { listAllProfilesByStatus } from "@/lib/marketplace/data";
import { CertificationsView } from "@/components/marketplace/CertificationsView";

export default async function CertificationsAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const rows = await listAllProfilesByStatus();

  return (
    <CertificationsView
      locale={locale}
      rows={rows.map((r) => ({
        ...r,
        certifiedAt: r.certifiedAt ? r.certifiedAt.toISOString() : null,
      }))}
    />
  );
}
