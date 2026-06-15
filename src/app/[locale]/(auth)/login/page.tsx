import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { Logo } from "@/components/brand/Logo";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("login");

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Hero side */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden bg-brand-gradient">
        <div className="flex items-center gap-2">
          <Logo tone="light" />
          <span className="font-semibold text-2xl tracking-tight">Madkhol</span>
        </div>
        <div className="space-y-6 relative z-10">
          <h1 className="text-5xl/tight font-semibold">
            {locale === "ar" ? (
              <>
                توجيه الخبراء،{" "}
                <span className="font-script font-normal text-madkhol-300">
                  مبسّط
                </span>
              </>
            ) : (
              <>
                Expert guidance,{" "}
                <span className="font-script font-normal text-madkhol-300">
                  simplified
                </span>
              </>
            )}
          </h1>
          <p className="text-white/80 max-w-md text-lg">
            {locale === "ar"
              ? "بوابة المستشار من مدخول — أدر دفترك بالكامل، من التخصيص إلى الزكاة، في مكان واحد."
              : "Madkhol Advisor Portal — manage your full book of business, from allocation to Zakat, in one place."}
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/80 relative z-10">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">{t("trust")}</span>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none [background-image:radial-gradient(circle_at_85%_15%,white_1px,transparent_1px)] [background-size:24px_24px]" />
      </aside>

      {/* Form side */}
      <section className="flex flex-col p-8 sm:p-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ms-auto">
            <LocaleSwitch currentLocale={locale} />
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-3xl font-semibold tracking-tight mb-2">
              {t("title")}
            </h2>
            <p className="text-muted mb-8">{t("subtitle")}</p>

            <LoginForm locale={locale} />

            <div className="mt-10 card p-5 bg-lime-soft border-madkhol-100">
              <p className="text-xs font-semibold text-madkhol-700 uppercase tracking-wider mb-3">
                {t("demoCreds")}
              </p>
              <p className="text-sm text-muted mb-4">{t("demoNote")}</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex justify-between gap-4 items-center">
                  <code className="font-mono text-deep">
                    advisor1@madkhol.com
                  </code>
                  <span className="text-muted text-xs">سعد العتيبي</span>
                </li>
                <li className="flex justify-between gap-4 items-center">
                  <code className="font-mono text-deep">
                    advisor2@madkhol.com
                  </code>
                  <span className="text-muted text-xs">سارة الدوسري</span>
                </li>
                <li className="flex justify-between gap-4 items-center pt-1.5 border-t border-madkhol-200/60">
                  <span className="text-xs text-muted">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </span>
                  <code className="font-mono text-deep">demo123</code>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted text-center mt-8">
          © 2026 Madkhol — {t("trust")}
        </p>
      </section>
    </main>
  );
}
