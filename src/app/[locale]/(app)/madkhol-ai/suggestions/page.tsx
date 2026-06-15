import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getConnection, getMockSuggestions } from "@/lib/madkhol-ai/data";
import { SuggestionsView } from "@/components/madkhol-ai/SuggestionsView";

export default async function SuggestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const connection = await getConnection(session.user.advisorId);
  const suggestions = connection.connected ? getMockSuggestions() : [];

  return (
    <SuggestionsView
      locale={locale}
      connected={connection.connected}
      suggestions={suggestions}
    />
  );
}
