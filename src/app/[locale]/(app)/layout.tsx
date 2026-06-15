import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  return (
    <div className="min-h-screen flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          locale={locale}
          advisorName={session.user.name ?? ""}
          advisorNameAr={session.user.nameAr ?? ""}
          licenseNo={session.user.licenseNo ?? ""}
        />
        <main className="flex-1 px-6 sm:px-10 py-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
