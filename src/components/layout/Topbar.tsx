"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LocaleSwitch } from "./LocaleSwitch";
import { ChevronDown, LogOut } from "lucide-react";
import { fmtGregorian, fmtHijri } from "@/lib/format";
import { useTranslations } from "next-intl";

export function Topbar({
  locale,
  advisorName,
  advisorNameAr,
  licenseNo,
}: {
  locale: string;
  advisorName: string;
  advisorNameAr: string;
  licenseNo: string;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const today = new Date();
  const displayName = locale === "ar" ? advisorNameAr : advisorName;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="h-16 border-b border-border bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="h-full px-6 sm:px-10 flex items-center justify-between gap-4">
        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-muted">
            {fmtGregorian(today, locale as "ar" | "en")}
          </span>
          <span className="text-xs text-ash-400">
            {fmtHijri(today, locale as "ar" | "en")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitch currentLocale={locale} />

          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-ash-100 transition"
            >
              <span className="w-9 h-9 rounded-full bg-brand-gradient text-white grid place-items-center text-sm font-semibold">
                {initials}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-[11px] text-ash-400">{licenseNo}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-ash-400" />
            </button>

            {open ? (
              <div
                className="absolute end-0 mt-2 w-56 card p-1.5 shadow-soft z-40"
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                  className="w-full text-start text-sm px-3 py-2 rounded-lg hover:bg-ash-100 flex items-center gap-2 text-deep"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
