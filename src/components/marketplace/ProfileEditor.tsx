"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  Save,
  Eye,
  CheckCircle2,
  EyeOff,
} from "lucide-react";
import {
  ALL_LANGUAGES,
  ALL_SPECIALIZATIONS,
  type CertificationStatus,
  type Language,
  type Specialization,
} from "@/lib/marketplace/types";
import { saveMarketplaceProfile } from "@/app/[locale]/(app)/marketplace/actions";

type Profile = {
  id: string;
  advisorId: string;
  bio: string;
  bioAr: string;
  philosophy: string;
  philosophyAr: string;
  yearsExperience: number;
  photoUrl: string | null;
  specializations: Specialization[];
  languages: Language[];
  feeStructure: string;
  feeBps: number;
  visible: boolean;
  certificationStatus: CertificationStatus;
  certifiedAt: string | null;
};

export function ProfileEditor({
  locale,
  advisorName,
  advisorNameAr,
  profile,
}: {
  locale: string;
  advisorName: string;
  advisorNameAr: string;
  profile: Profile | null;
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [bio, setBio] = useState(profile?.bio ?? "");
  const [bioAr, setBioAr] = useState(profile?.bioAr ?? "");
  const [philosophy, setPhilosophy] = useState(profile?.philosophy ?? "");
  const [philosophyAr, setPhilosophyAr] = useState(profile?.philosophyAr ?? "");
  const [yearsExperience, setYearsExp] = useState(profile?.yearsExperience ?? 5);
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? "");
  const [specs, setSpecs] = useState<Specialization[]>(profile?.specializations ?? []);
  const [langs, setLangs] = useState<Language[]>(profile?.languages ?? ["ar", "en"]);
  const [feeStructure, setFeeStructure] = useState(profile?.feeStructure ?? "1.00% AuM/year");
  const [feeBps, setFeeBps] = useState(profile?.feeBps ?? 100);
  const [visible, setVisible] = useState(profile?.visible ?? false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function toggleSpec(s: Specialization) {
    setSpecs((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }
  function toggleLang(l: Language) {
    setLangs((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));
  }

  async function save() {
    setSaving(true);
    try {
      await saveMarketplaceProfile({
        bio: bio.trim(),
        bioAr: bioAr.trim(),
        philosophy: philosophy.trim(),
        philosophyAr: philosophyAr.trim(),
        yearsExperience,
        photoUrl: photoUrl.trim() || null,
        specializations: specs,
        languages: langs,
        feeStructure: feeStructure.trim(),
        feeBps,
        visible,
      });
      setSavedAt(Date.now());
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("profileEditorTitle")}</h1>
          <p className="text-muted mt-1 max-w-2xl">{t("profileEditorSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {profile?.id ? (
            <Link
              href={`/${locale}/consumer/advisor/${profile.id}`}
              target="_blank"
              className="btn-outline"
            >
              <Eye className="w-4 h-4" />
              {t("profileEditorPreview")}
            </Link>
          ) : null}
          <button onClick={save} disabled={saving} className="btn-gradient">
            <Save className="w-4 h-4" />
            {saving ? t("profileEditorSaving") : t("profileEditorSave")}
          </button>
        </div>
      </header>

      {/* Visibility toggle + status */}
      <div
        className={cn(
          "card p-4 flex items-center gap-3 flex-wrap",
          visible
            ? "bg-madkhol-50/40 border-madkhol-200"
            : "bg-amber-50/40 border-amber-200",
        )}
      >
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className={cn(
            "relative w-11 h-6 rounded-full transition shrink-0",
            visible ? "bg-madkhol-600" : "bg-ash-300",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all",
              visible ? "start-5" : "start-0.5",
            )}
          />
        </button>
        <div className="flex-1 min-w-[160px]">
          <p className="text-sm font-medium inline-flex items-center gap-2">
            {visible ? (
              <Eye className="w-4 h-4 text-madkhol-700" />
            ) : (
              <EyeOff className="w-4 h-4 text-amber-700" />
            )}
            {visible ? t("profileEditorVisible") : t("profileEditorHidden")}
          </p>
          {!visible ? (
            <p className="text-xs text-amber-700 mt-0.5">{t("noVisibleNotice")}</p>
          ) : null}
        </div>
        <span className="badge badge-success text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t(`certPending`).split(" ")[0]}: {profile?.certificationStatus ?? "pending"}
        </span>
        {savedAt ? (
          <span className="text-xs text-madkhol-700 font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("profileEditorSaved")}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity */}
        <section className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">
            {t("fieldName")}
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">EN</p>
              <p className="font-medium">{advisorName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">AR</p>
              <p className="font-medium" dir="rtl">{advisorNameAr}</p>
            </div>
          </div>

          <div>
            <label className="label">{t("fieldPhoto")}</label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… (leave empty for initials avatar)"
              className="input"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t("fieldYearsExp")}</label>
              <input
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) => setYearsExp(Number(e.target.value))}
                className="input tabular text-end"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">{t("fieldFeeBps")}</label>
              <input
                type="number"
                min={0}
                max={500}
                value={feeBps}
                onChange={(e) => setFeeBps(Number(e.target.value))}
                className="input tabular text-end"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="label">{t("fieldFee")}</label>
            <input
              value={feeStructure}
              onChange={(e) => setFeeStructure(e.target.value)}
              className="input"
            />
          </div>
        </section>

        {/* Bio + Philosophy */}
        <section className="card p-5 space-y-4">
          <div>
            <label className="label">{t("fieldBio")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="A short bio retail users will see…"
            />
          </div>
          <div>
            <label className="label">{t("fieldBioAr")}</label>
            <textarea
              value={bioAr}
              onChange={(e) => setBioAr(e.target.value)}
              rows={4}
              className="input resize-none"
              dir="rtl"
            />
          </div>
        </section>

        <section className="card p-5 space-y-4 lg:col-span-2">
          <div>
            <label className="label">{t("fieldPhilosophy")}</label>
            <textarea
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              rows={6}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">{t("fieldPhilosophyAr")}</label>
            <textarea
              value={philosophyAr}
              onChange={(e) => setPhilosophyAr(e.target.value)}
              rows={6}
              className="input resize-none"
              dir="rtl"
            />
          </div>
        </section>

        <section className="card p-5 lg:col-span-2 space-y-5">
          <div>
            <label className="label">{t("fieldSpecializations")}</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SPECIALIZATIONS.map((s) => {
                const active = specs.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpec(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition",
                      active
                        ? "bg-deep border-deep text-white"
                        : "bg-white border-border text-ash-600 hover:border-madkhol-300",
                    )}
                  >
                    {t(`spec_${s}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">{t("fieldLanguages")}</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LANGUAGES.map((l) => {
                const active = langs.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition",
                      active
                        ? "bg-deep border-deep text-white"
                        : "bg-white border-border text-ash-600 hover:border-madkhol-300",
                    )}
                  >
                    {t(`lang_${l}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
