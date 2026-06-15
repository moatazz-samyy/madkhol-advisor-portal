"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

export function LocaleSwitch({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const other = currentLocale === "ar" ? "en" : "ar";
  const label = other === "ar" ? "العربية" : "English";

  function switchLocale() {
    // Swap the leading locale segment, keep the rest of the path
    const next = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`);
    router.push(next || `/${other}/dashboard`);
    router.refresh();
  }

  return (
    <button
      onClick={switchLocale}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-deep px-3 py-1.5 rounded-lg hover:bg-ash-100 transition"
      aria-label="Switch language"
    >
      <Languages className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
