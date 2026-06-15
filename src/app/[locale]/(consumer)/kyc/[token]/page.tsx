import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { KycForm } from "@/components/kyc/KycForm";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

// Public, unauthenticated. The KYC token IS the auth — anyone with the link
// can submit. Advisor controls who gets the link.
export default async function KycPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const client = await prisma.client.findUnique({
    where: { kycToken: token },
    select: {
      id: true,
      name: true,
      nameAr: true,
      nationalId: true,
      kycCompletedAt: true,
      advisor: {
        select: { name: true, nameAr: true, brandColor: true, logoUrl: true },
      },
    },
  });

  const t = await getTranslations("kyc");

  // No row → either bad token or already-burned (status flipped to active).
  // We can't distinguish without more state, so show a unified "already done"
  // screen to avoid leaking whether a token ever existed.
  if (!client) {
    return <AlreadyDoneScreen t={t} />;
  }

  // Belt-and-braces: if somehow the token's still live but the timestamp is
  // set, show the same finished state.
  if (client.kycCompletedAt) {
    return <AlreadyDoneScreen t={t} />;
  }

  return (
    <KycForm
      locale={locale}
      token={token}
      clientName={locale === "ar" ? client.nameAr : client.name}
      clientNationalIdLastFour={client.nationalId.slice(-4)}
      advisorName={
        locale === "ar" ? client.advisor.nameAr : client.advisor.name
      }
    />
  );
}

function AlreadyDoneScreen({ t }: { t: (k: string) => string }) {
  return (
    <div className="max-w-xl mx-auto card p-12 text-center mt-12">
      <div className="w-16 h-16 rounded-2xl bg-madkhol-50 grid place-items-center mx-auto mb-4 text-madkhol-700">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">{t("alreadyDoneTitle")}</h1>
      <p className="text-muted text-sm max-w-sm mx-auto">
        {t("alreadyDoneBody")}
      </p>
      <div className="inline-flex items-center gap-1.5 mt-6 text-xs text-muted">
        <ShieldCheck className="w-3.5 h-3.5" />
        {t("cmaLicensed")}
      </div>
    </div>
  );
}
