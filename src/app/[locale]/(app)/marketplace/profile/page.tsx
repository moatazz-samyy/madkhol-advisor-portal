import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getOwnProfile } from "@/lib/marketplace/data";
import { ProfileEditor } from "@/components/marketplace/ProfileEditor";

export default async function MarketplaceProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const profile = await getOwnProfile(session.user.advisorId);

  return (
    <ProfileEditor
      locale={locale}
      advisorName={session.user.name ?? ""}
      advisorNameAr={session.user.nameAr ?? ""}
      profile={
        profile
          ? {
              ...profile,
              certifiedAt: profile.certifiedAt
                ? profile.certifiedAt.toISOString()
                : null,
            }
          : null
      }
    />
  );
}
