"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Scale,
  PieChart,
  ShieldCheck,
  Receipt,
  CalendarHeart,
  Scroll,
  MessageCircle,
  CreditCard,
  Sparkles,
  FileText,
  History,
  SearchIcon,
  Sliders,
  LayoutGrid,
  Brain,
  Gauge,
  LineChart as LineChartIcon,
  Mail,
  IdCard,
  Award,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type NavItem = {
  href: string;
  label: keyof IntlMessages["nav"];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  stub?: boolean;
  badge?: string; // small pill rendered next to the label, e.g. "AI"
};

type IntlMessages = {
  nav: {
    dashboard: string; clients: string; search: string; optimizer: string;
    sectors: string; madkholAi: string; projections: string;
    marketplaceInquiries: string; marketplaceProfile: string;
    marketplaceSection: string; marketplaceAdmin: string;
    tools: string;
    monitor: string;
    allocation: string; rebalance: string; models: string;
    differentiators: string; shariah: string; zakat: string;
    gosi: string; mirath: string; whatsapp: string;
    settings: string; billing: string; whiteLabel: string;
    reporting: string; audit: string; logout: string;
  };
};

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "dashboard", Icon: LayoutDashboard },
  { href: "/clients", label: "clients", Icon: Users },
  { href: "/search", label: "search", Icon: SearchIcon },
  { href: "/sectors", label: "sectors", Icon: LayoutGrid },
  { href: "/madkhol-ai", label: "madkholAi", Icon: Brain, badge: "AI" },
];

const TOOLS: NavItem[] = [
  { href: "/monitor", label: "monitor", Icon: Gauge },
  { href: "/allocation", label: "allocation", Icon: ArrowLeftRight, stub: true },
  { href: "/rebalance", label: "rebalance", Icon: Scale, stub: true },
  { href: "/models", label: "models", Icon: PieChart, stub: true },
  { href: "/optimizer", label: "optimizer", Icon: Sliders, stub: true },
  { href: "/projections", label: "projections", Icon: LineChartIcon },
];

const DIFFERENTIATORS: NavItem[] = [
  { href: "/shariah", label: "shariah", Icon: ShieldCheck, stub: true },
  { href: "/zakat", label: "zakat", Icon: Receipt, stub: true },
  { href: "/gosi", label: "gosi", Icon: CalendarHeart, stub: true },
  { href: "/mirath", label: "mirath", Icon: Scroll, stub: true },
  { href: "/messages", label: "whatsapp", Icon: MessageCircle, stub: true },
];

const MARKETPLACE: NavItem[] = [
  { href: "/marketplace/inquiries", label: "marketplaceInquiries", Icon: Mail },
  { href: "/marketplace/profile", label: "marketplaceProfile", Icon: IdCard },
  { href: "/admin/marketplace/certifications", label: "marketplaceAdmin", Icon: Award },
];

const SETTINGS: NavItem[] = [
  { href: "/billing", label: "billing", Icon: CreditCard },
  { href: "/white-label", label: "whiteLabel", Icon: Sparkles },
  { href: "/reporting", label: "reporting", Icon: FileText },
  { href: "/audit", label: "audit", Icon: History },
];

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-e border-border bg-white flex flex-col">
      <div className="px-5 h-16 flex items-center border-b border-border">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-2"
        >
          <Logo />
          <span className="font-semibold text-xl tracking-tight">Madkhol</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <Group items={MAIN} locale={locale} pathname={pathname} t={t} />
        <Section title={t("tools")}>
          <Group items={TOOLS} locale={locale} pathname={pathname} t={t} />
        </Section>
        <Section title={t("differentiators")}>
          <Group items={DIFFERENTIATORS} locale={locale} pathname={pathname} t={t} />
        </Section>
        <Section title={t("marketplaceSection")}>
          <Group items={MARKETPLACE} locale={locale} pathname={pathname} t={t} />
        </Section>
        <Section title={t("settings")}>
          <Group items={SETTINGS} locale={locale} pathname={pathname} t={t} />
        </Section>
      </nav>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ash-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Group({
  items,
  locale,
  pathname,
  t,
}: {
  items: NavItem[];
  locale: string;
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, label, Icon, stub, badge }) => {
        const fullHref = `/${locale}${href}`;
        const active =
          pathname === fullHref || pathname.startsWith(`${fullHref}/`);
        return (
          <li key={href}>
            <Link
              href={fullHref}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition",
                active
                  ? "bg-madkhol-50 text-madkhol-800"
                  : "text-ash-600 hover:bg-ash-50 hover:text-deep",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active ? "text-madkhol-600" : "text-ash-400 group-hover:text-deep",
                )}
              />
              <span className="flex-1 truncate">{t(label)}</span>
              {badge ? (
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md text-white shrink-0",
                    badge === "α"
                      ? "bg-deep"
                      : "bg-brand-gradient",
                  )}
                >
                  {badge}
                </span>
              ) : stub ? (
                <span className="text-[10px] text-ash-400 group-hover:text-ash-500">
                  •
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
