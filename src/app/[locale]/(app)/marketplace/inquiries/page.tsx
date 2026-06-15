import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { listInquiries } from "@/lib/marketplace/data";
import { maskUserName } from "@/lib/marketplace/config";
import { InquiriesView } from "@/components/marketplace/InquiriesView";

export default async function MarketplaceInquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const inquiries = await listInquiries(session.user.advisorId);

  // Mask at the boundary — the raw user name + email never leave the server.
  // The advisor identifies the user via the inquiry id; replies/scheduling
  // route through server actions that re-load the full record server-side.
  return (
    <InquiriesView
      locale={locale}
      inquiries={inquiries.map((i) => ({
        id: i.id,
        maskedUserName: maskUserName(i.userName),
        selectedTier: i.selectedTier,
        topic: i.topic,
        status: i.status,
        messages: i.messages,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
