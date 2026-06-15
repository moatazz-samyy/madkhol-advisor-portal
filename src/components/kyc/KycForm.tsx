"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  ShieldCheck,
  CheckCircle2,
  CircleAlert,
  IdCard,
  Camera,
  PenLine,
  Upload,
} from "lucide-react";
import { submitKyc } from "@/app/[locale]/(app)/clients/actions";

export function KycForm({
  token,
  clientName,
  clientNationalIdLastFour,
  advisorName,
}: {
  locale: string;
  token: string;
  clientName: string;
  clientNationalIdLastFour: string;
  advisorName: string;
}) {
  const t = useTranslations("kyc");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [confirmedNationalId, setConfirmedNationalId] = useState("");
  const [confirmedFullName, setConfirmedFullName] = useState(clientName);
  const [hasIdPhoto, setHasIdPhoto] = useState(false);
  const [hasSelfie, setHasSelfie] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Demo policy: full-NID required, last 4 must match the advisor's record
  const nidValid =
    /^[12]\d{9}$/.test(confirmedNationalId.trim()) &&
    confirmedNationalId.trim().slice(-4) === clientNationalIdLastFour;

  const canSubmit =
    nidValid &&
    confirmedFullName.trim().length > 1 &&
    hasIdPhoto &&
    hasSelfie &&
    acceptedTerms &&
    !submitting;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitKyc({
        token,
        confirmedNationalId: confirmedNationalId.trim(),
        confirmedFullName: confirmedFullName.trim(),
        acceptedTerms,
      });
      setDone(true);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto card p-12 text-center mt-12">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-brand-gradient animate-pulse opacity-30 blur-xl" />
          <div className="relative w-20 h-20 rounded-full bg-brand-gradient grid place-items-center text-white shadow-soft">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-2">{t("doneTitle")}</h1>
        <p className="text-muted text-sm max-w-sm mx-auto">
          {t("doneBody", { advisor: advisorName })}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-6 text-xs text-muted">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("cmaLicensed")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="card p-6 bg-brand-soft border-madkhol-200">
        <p className="text-xs uppercase tracking-wider font-semibold text-madkhol-700 mb-1">
          {t("invitedBy", { advisor: advisorName })}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("welcome", { name: clientName })}
        </h1>
        <p className="text-sm text-muted mt-2 max-w-lg">{t("welcomeBody")}</p>
      </header>

      {/* Section 1: Confirm identity */}
      <Section
        icon={<IdCard className="w-5 h-5" />}
        title={t("section1Title")}
        body={t("section1Body")}
      >
        <Field label={t("fieldFullName")} required>
          <input
            value={confirmedFullName}
            onChange={(e) => setConfirmedFullName(e.target.value)}
            className="input"
          />
        </Field>
        <Field
          label={t("fieldNationalId")}
          required
          hint={t("fieldNationalIdHint", { last4: clientNationalIdLastFour })}
        >
          <input
            value={confirmedNationalId}
            onChange={(e) =>
              setConfirmedNationalId(
                e.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            placeholder="1XXXXXXXXX"
            inputMode="numeric"
            className="input tabular"
            dir="ltr"
          />
        </Field>
      </Section>

      {/* Section 2: Documents */}
      <Section
        icon={<Camera className="w-5 h-5" />}
        title={t("section2Title")}
        body={t("section2Body")}
      >
        <UploadTile
          label={t("uploadId")}
          hint={t("uploadIdHint")}
          done={hasIdPhoto}
          onClick={() => setHasIdPhoto((x) => !x)}
        />
        <UploadTile
          label={t("uploadSelfie")}
          hint={t("uploadSelfieHint")}
          done={hasSelfie}
          onClick={() => setHasSelfie((x) => !x)}
        />
      </Section>

      {/* Section 3: Sign */}
      <Section
        icon={<PenLine className="w-5 h-5" />}
        title={t("section3Title")}
        body={t("section3Body")}
      >
        <label className="card p-3 flex items-start gap-3 cursor-pointer hover:bg-ash-50 transition">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-madkhol-600"
          />
          <span className="text-sm">{t("termsAccept", { advisor: advisorName })}</span>
        </label>
      </Section>

      {error ? (
        <div className="card p-3 bg-red-50 border-red-200 flex items-start gap-2 text-sm text-red-700">
          <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 pb-12">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("cmaLicensed")}
        </span>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn-gradient text-base px-6 py-3"
        >
          <CheckCircle2 className="w-5 h-5" />
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </div>
  );
}

// ─── Bits ───────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-madkhol-50 text-madkhol-700 grid place-items-center">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted">{body}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required ? <span className="text-red-500 ms-1">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-muted mt-1">{hint}</p> : null}
    </div>
  );
}

function UploadTile({
  label,
  hint,
  done,
  onClick,
}: {
  label: string;
  hint: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full card p-4 flex items-center gap-3 text-start transition",
        done
          ? "border-madkhol-500 bg-madkhol-50/40"
          : "border-dashed hover:border-madkhol-300",
      )}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-xl grid place-items-center shrink-0",
          done
            ? "bg-madkhol-600 text-white"
            : "bg-ash-100 text-ash-500",
        )}
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </button>
  );
}
