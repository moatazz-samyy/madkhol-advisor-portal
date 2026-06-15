"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { fmtSar } from "@/lib/format";
import {
  Search,
  ShieldCheck,
  Wallet,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  ALL_LANGUAGES,
  ALL_SPECIALIZATIONS,
  type Language,
  type Specialization,
} from "@/lib/marketplace/types";
import type { MarketplaceCard } from "@/lib/marketplace/data";

export function MarketplaceList({
  locale,
  advisors,
}: {
  locale: string;
  advisors: MarketplaceCard[];
}) {
  const t = useTranslations("marketplace");
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<Specialization | "">("");
  const [lang, setLang] = useState<Language | "">("");
  const [maxFeeBps, setMaxFeeBps] = useState<number | null>(null);
  const [minExp, setMinExp] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return advisors.filter((a) => {
      if (spec && !a.specializations.includes(spec)) return false;
      if (lang && !a.languages.includes(lang)) return false;
      if (maxFeeBps !== null && a.feeBps > maxFeeBps) return false;
      if (minExp !== null && a.yearsExperience < minExp) return false;
      if (needle) {
        const blob = `${a.name} ${a.nameAr} ${a.specializations.join(" ")}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      return true;
    });
  }, [advisors, q, spec, lang, maxFeeBps, minExp]);

  const noFilters =
    !q.trim() && !spec && !lang && maxFeeBps === null && minExp === null;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="card p-10 lg:p-14 bg-brand-soft border-madkhol-100 relative overflow-hidden">
        <div className="absolute -end-20 -top-20 w-72 h-72 rounded-full bg-madkhol-200/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur mb-4 text-xs font-semibold text-madkhol-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            CMA · Madkhol-Certified
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
            {locale === "ar" ? (
              <>
                اعثر على مستشارك{" "}
                <span className="font-script font-normal text-madkhol-600">
                  المعتمد
                </span>{" "}
                من مدخول
              </>
            ) : (
              <>
                Find your{" "}
                <span className="font-script font-normal text-madkhol-600">
                  certified
                </span>{" "}
                Madkhol advisor
              </>
            )}
          </h1>
          <p className="text-muted mt-4 text-lg max-w-xl">{t("heroSubtitle")}</p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="input ps-9 py-2 text-sm"
          />
        </div>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value as Specialization | "")}
          className="input w-auto py-2 text-sm"
        >
          <option value="">{t("filterSpec")}</option>
          {ALL_SPECIALIZATIONS.map((s) => (
            <option key={s} value={s}>
              {t(`spec_${s}`)}
            </option>
          ))}
        </select>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language | "")}
          className="input w-auto py-2 text-sm"
        >
          <option value="">{t("filterLang")}</option>
          {ALL_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {t(`lang_${l}`)}
            </option>
          ))}
        </select>
        <select
          value={maxFeeBps ?? ""}
          onChange={(e) =>
            setMaxFeeBps(e.target.value === "" ? null : Number(e.target.value))
          }
          className="input w-auto py-2 text-sm"
        >
          <option value="">{t("filterFee")}: {t("anyFee")}</option>
          <option value={50}>{t("feePctLabel", { n: "0.50" })}</option>
          <option value={80}>{t("feePctLabel", { n: "0.80" })}</option>
          <option value={100}>{t("feePctLabel", { n: "1.00" })}</option>
          <option value={150}>{t("feePctLabel", { n: "1.50" })}</option>
        </select>
        <select
          value={minExp ?? ""}
          onChange={(e) =>
            setMinExp(e.target.value === "" ? null : Number(e.target.value))
          }
          className="input w-auto py-2 text-sm"
        >
          <option value="">{t("filterExp")}: {t("anyExp")}</option>
          <option value={5}>{t("yearsLabel", { n: 5 })}</option>
          <option value={10}>{t("yearsLabel", { n: 10 })}</option>
          <option value={15}>{t("yearsLabel", { n: 15 })}</option>
        </select>
        {!noFilters ? (
          <button
            onClick={() => {
              setQ("");
              setSpec("");
              setLang("");
              setMaxFeeBps(null);
              setMinExp(null);
            }}
            className="btn-ghost text-xs"
          >
            <X className="w-3.5 h-3.5" />
            {t("filterReset")}
          </button>
        ) : null}
        <span className="text-xs text-muted tabular ms-auto">
          {filtered.length} / {advisors.length}
        </span>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center text-muted">{t("noResults")}</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <li key={a.id}>
              <AdvisorCard locale={locale} advisor={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdvisorCard({
  locale,
  advisor,
}: {
  locale: string;
  advisor: MarketplaceCard;
}) {
  const t = useTranslations("marketplace");
  const displayName = locale === "ar" ? advisor.nameAr : advisor.name;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <Link
      href={`/${locale}/consumer/advisor/${advisor.id}`}
      className="card p-5 flex flex-col h-full transition hover:shadow-soft hover:-translate-y-0.5 bg-white"
    >
      <div className="flex items-start gap-4 mb-4">
        {advisor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={advisor.photoUrl}
            alt={displayName}
            className="w-16 h-16 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-brand-gradient text-white grid place-items-center text-lg font-semibold shrink-0">
            {initials}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-madkhol-700" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-madkhol-700">
              {t("certified")}
            </span>
          </div>
          <h3 className="font-semibold text-lg leading-tight">{displayName}</h3>
          <p className="text-xs text-muted mt-0.5">
            {t("yearsOf", { n: advisor.yearsExperience })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {advisor.specializations.slice(0, 3).map((s) => (
          <span
            key={s}
            className="badge bg-madkhol-50 text-madkhol-700 text-[10px]"
          >
            {t(`spec_${s}`)}
          </span>
        ))}
      </div>

      <div className="card p-2.5 text-xs mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1 mb-1">
          <Wallet className="w-3 h-3" />
          {t("totalAum")}
        </p>
        <p className="text-sm font-semibold tabular">
          {fmtSar(advisor.totalAumSar)}{" "}
          <span className="text-[10px] text-muted font-normal">SAR</span>
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted">{advisor.feeStructure}</span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-madkhol-700">
          {t("viewProfile")}
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
