import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getClientsList } from "@/lib/data";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { AddClientButton } from "@/components/clients/AddClientButton";

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [clients, t] = await Promise.all([
    getClientsList(session.user.advisorId),
    getTranslations("clients"),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>
        <AddClientButton locale={locale} />
      </header>

      <ClientsTable
        clients={clients.map((c) => ({ ...c, lastActivityAt: c.lastActivityAt.toISOString(), joinedAt: c.joinedAt.toISOString() }))}
        locale={locale}
      />
    </div>
  );
}
