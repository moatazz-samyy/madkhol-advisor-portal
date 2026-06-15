import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";

/**
 * Consumer-facing route group layout.
 *
 * Intentionally distinct from the advisor portal shell:
 *  - no sidebar
 *  - cream-toned background
 *  - top header has logo + "Are you an advisor?" link (deep-links to /login)
 *  - generous spacing in the wrapper
 *
 * Public — no auth gate. Anyone visiting `/consumer/...` sees the marketplace
 * regardless of session state.
 */
export default async function ConsumerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplace");

  return (
    <div className="min-h-screen bg-cream/40">
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link
            href={`/${locale}/consumer/marketplace`}
            className="inline-flex items-center gap-2"
          >
            <Logo />
            <span className="font-semibold text-xl tracking-tight">Madkhol</span>
          </Link>
          <div className="flex items-center gap-4">
            <LocaleSwitch currentLocale={locale} />
            <Link
              href={`/${locale}/login`}
              className="text-sm text-muted hover:text-deep transition"
            >
              {t("consumerLoginLink")}
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">{children}</main>
      <footer className="border-t border-border bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6 text-xs text-muted text-center">
          © 2026 Madkhol — {t("freeForUsers")}
        </div>
      </footer>
    </div>
  );
}
