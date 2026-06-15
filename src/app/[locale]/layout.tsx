import type { Metadata } from "next";
import { Rubik, Tajawal, Pacifico } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { locales, localeDir, type Locale } from "@/i18n/config";
import "../globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-rubik",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Madkhol Advisor Portal",
  description:
    "Saudi-native B2B platform for independent CMA-licensed investment advisors.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={localeDir[locale as Locale]}
      className={`${rubik.variable} ${tajawal.variable} ${pacifico.variable}`}
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
