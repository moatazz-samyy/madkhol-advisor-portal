"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import {
  ShieldCheck,
  Users,
  Wallet,
  ChevronLeft,
  Globe,
  Sparkles,
} from "lucide-react";
import type { MarketplaceProfile } from "@/lib/marketplace/data";
import { ALL_TIERS, type ServiceTier } from "@/lib/marketplace/types";
import { RequestMeetingModal } from "./RequestMeetingModal";

export function ConsumerAdvisorProfile({
  locale,
  profile,
}: {
  locale: string;
  profile: MarketplaceProfile;
}) {
  const t = useTranslations("marketplace");
  const displayName = locale === "ar" ? profile.nameAr : profile.name;
  const bio = locale === "ar" ? profile.bioAr : profile.bio;
  const philosophy = locale === "ar" ? profile.philosophyAr : profile.philosophy;

  const [tier, setTier] = useState<ServiceTier>("advice_only");
  const [requestOpen, setRequestOpen] = useState(false);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-8">
      <Link
        href={`/${locale}/consumer/marketplace`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-deep"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        {t("backToList")}
      </Link>

      {/* Hero */}
      <section className="card p-8 bg-brand-soft border-madkhol-100 relative overflow-hidden">
        <div className="absolute -end-20 -top-20 w-72 h-72 rounded-full bg-madkhol-200/30 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-start gap-6">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl}
              alt={displayName}
              className="w-28 h-28 rounded-3xl object-cover shrink-0"
            />
          ) : (
            <span className="w-28 h-28 rounded-3xl bg-brand-gradient text-white grid place-items-center text-2xl font-semibold shrink-0 shadow-soft">
              {initials}
            </span>
          )}
          <div className="flex-1 min-w-[260px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-xs font-bold text-madkhol-700 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("certified")}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
            <p className="text-sm text-muted mt-1">
              {t("yearsOf", { n: profile.yearsExperience })}
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Stat
                Icon={Wallet}
                label={t("totalAum")}
                value={`${fmtSar(profile.totalAumSar)} SAR`}
              />
              <Stat
                Icon={Users}
                label={t("profileClients")}
                value={profile.currentClientCount.toString()}
              />
              <Stat
                Icon={Sparkles}
                label={t("profileFee")}
                value={profile.feeStructure}
              />
              <Stat
                Icon={Globe}
                label={t("profileLanguages")}
                value={profile.languages.map((l) => t(`lang_${l}`)).join(" · ")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bio + Philosophy + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm uppercase tracking-wider font-bold text-muted mb-3">
              {t("profileBio")}
            </h2>
            <p className="text-base leading-relaxed text-deep">{bio}</p>
          </div>

          <div className="card p-6">
            <h2 className="text-sm uppercase tracking-wider font-bold text-muted mb-3">
              {t("profilePhilosophy")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-deep">
              {philosophy.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {/* Specializations */}
          <div className="card p-5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-3">
              {t("profileSpecializations")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.specializations.map((s) => (
                <span key={s} className="badge bg-madkhol-50 text-madkhol-700 text-xs">
                  {t(`spec_${s}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Tier selector */}
          <div className="card p-5 sticky top-20">
            <h3 className="text-sm font-semibold mb-3">{t("tierTitle")}</h3>
            <ul className="space-y-2">
              {ALL_TIERS.map((tt) => (
                <li key={tt}>
                  <label
                    className={cn(
                      "card p-3 flex items-start gap-2.5 cursor-pointer transition",
                      tier === tt
                        ? "border-madkhol-500 bg-madkhol-50/40 shadow-ring"
                        : "border-border bg-white hover:border-madkhol-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="tier"
                      checked={tier === tt}
                      onChange={() => setTier(tt)}
                      className="w-4 h-4 mt-0.5 accent-madkhol-600"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold">
                          {t(`tier_${tt}`)}
                        </span>
                        {tt === "advice_only" ? (
                          <span className="badge-success text-[10px]">
                            {t("tier_recommended")}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted">{t(`tier_${tt}_desc`)}</p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setRequestOpen(true)}
              className="btn-gradient w-full mt-4"
            >
              {t("requestMeeting")}
            </button>
            <p className="text-[10px] text-muted text-center mt-2">
              {t("freeForUsers")}
            </p>
          </div>
        </aside>
      </div>

      {requestOpen ? (
        <RequestMeetingModal
          locale={locale}
          profileId={profile.id}
          advisorName={locale === "ar" ? profile.nameAr : profile.name}
          tier={tier}
          onClose={() => setRequestOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-sm font-semibold tabular">{value}</p>
    </div>
  );
}
