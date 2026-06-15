import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WhiteLabelView } from "@/components/operational/WhiteLabelView";

export default async function WhiteLabelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const advisor = await prisma.advisor.findUnique({
    where: { id: session.user.advisorId },
    select: { name: true, nameAr: true, logoUrl: true, brandColor: true },
  });

  return (
    <WhiteLabelView
      locale={locale}
      advisorName={advisor?.name ?? ""}
      advisorNameAr={advisor?.nameAr ?? ""}
      currentLogoUrl={advisor?.logoUrl ?? null}
      currentBrandColor={advisor?.brandColor ?? "#0A2E1F"}
    />
  );
}
