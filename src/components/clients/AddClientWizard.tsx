"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import { WizardSteps } from "@/components/tools/WizardSteps";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  Wallet,
  CalendarHeart,
  CircleAlert,
  Copy,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/app/[locale]/(app)/clients/actions";

const STEP_KEYS = ["identity", "contact", "risk", "context", "review"] as const;
type StepKey = (typeof STEP_KEYS)[number];

type FormState = {
  name: string;
  nameAr: string;
  nationalId: string;
  phone: string;
  email: string;
  suitabilityScore: number;
  hijriYearEndIso: string;
  expectedRetireAge: number;
  monthlyExpenseSar: number;
  startingDepositSar: number;
};

const DEFAULTS: FormState = {
  name: "",
  nameAr: "",
  nationalId: "",
  phone: "",
  email: "",
  suitabilityScore: 50,
  // Default Hijri year-end ≈ 11 months from today (most clients in Saudi pick
  // their Hijri birth year-end; this is a sensible demo placeholder).
  hijriYearEndIso: defaultHijriYearEnd(),
  expectedRetireAge: 60,
  monthlyExpenseSar: 15_000,
  startingDepositSar: 100_000,
};

function defaultHijriYearEnd(): string {
  // Use a stable derived string so tests / hydration don't drift. Pick the
  // 1st of next-next month so the picker has something Saudi-plausible.
  const now = new Date();
  const d = new Date(now.getFullYear() + 1, now.getMonth(), 1);
  return d.toISOString().slice(0, 10);
}

export function AddClientWizard({
  locale,
  onClose,
}: {
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("addClient");
  const router = useRouter();

  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    clientId: string;
    kycToken: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  const stepKey: StepKey = STEP_KEYS[step];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Per-step validation so Next is disabled until the step's fields are sane.
  const stepValid = useMemo(() => {
    switch (stepKey) {
      case "identity":
        return (
          form.name.trim().length > 1 &&
          form.nameAr.trim().length > 1 &&
          /^[12]\d{9}$/.test(form.nationalId.trim())
        );
      case "contact":
        return (
          /^(?:\+?966|0)?5\d{8}$/.test(form.phone.replace(/\s/g, "")) &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        );
      case "risk":
        return form.suitabilityScore >= 1 && form.suitabilityScore <= 100;
      case "context":
        return (
          form.expectedRetireAge >= 45 &&
          form.expectedRetireAge <= 75 &&
          form.monthlyExpenseSar >= 1_000 &&
          form.startingDepositSar >= 0 &&
          form.hijriYearEndIso.length === 10
        );
      case "review":
        return true;
    }
  }, [stepKey, form]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createClient({
        name: form.name,
        nameAr: form.nameAr,
        nationalId: form.nationalId,
        phone: form.phone,
        email: form.email,
        suitabilityScore: form.suitabilityScore,
        hijriYearEndIso: form.hijriYearEndIso,
        expectedRetireAge: form.expectedRetireAge,
        monthlyExpenseSar: form.monthlyExpenseSar,
        startingDepositSar: form.startingDepositSar,
      });
      setSuccess({ clientId: res.clientId, kycToken: res.kycToken });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function viewClient() {
    if (!success) return;
    router.push(`/${locale}/clients/${success.clientId}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-3xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
              <UserPlus className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t("modalTitle")}</h2>
              <p className="text-xs text-muted">{t("modalSubtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <SuccessScreen
            t={t}
            locale={locale}
            name={locale === "ar" ? form.nameAr : form.name}
            phone={form.phone}
            kycToken={success.kycToken}
            onView={viewClient}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="px-6 pt-4">
              <WizardSteps
                steps={STEP_KEYS.map((key) => ({ key, label: t(`step_${key}`) }))}
                active={step}
              />
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {stepKey === "identity" ? (
                <IdentityStep t={t} form={form} set={set} />
              ) : null}
              {stepKey === "contact" ? (
                <ContactStep t={t} form={form} set={set} />
              ) : null}
              {stepKey === "risk" ? (
                <RiskStep t={t} form={form} set={set} />
              ) : null}
              {stepKey === "context" ? (
                <ContextStep t={t} form={form} set={set} />
              ) : null}
              {stepKey === "review" ? (
                <ReviewStep t={t} form={form} locale={locale} />
              ) : null}
              {error ? (
                <div className="card p-3 mt-4 bg-red-50 border-red-200 flex items-start gap-2 text-sm text-red-700">
                  <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  step === 0 ? onClose() : setStep((s) => s - 1)
                }
                className="btn-outline"
              >
                {step === 0 ? (
                  t("cancel")
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    {t("back")}
                  </>
                )}
              </button>
              {stepKey === "review" ? (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn-gradient"
                >
                  {submitting ? t("creating") : t("createClient")}
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!stepValid}
                  className="btn-gradient"
                >
                  {t("next")}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Identity ───────────────────────────────────────────────────────

function IdentityStep({
  t,
  form,
  set,
}: {
  t: (k: string) => string;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="font-semibold">{t("identityTitle")}</h3>
      <p className="text-sm text-muted">{t("identityHint")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("name")} required>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Abdullah Al-Otaibi"
            className="input"
            dir="ltr"
          />
        </Field>
        <Field label={t("nameAr")} required>
          <input
            value={form.nameAr}
            onChange={(e) => set("nameAr", e.target.value)}
            placeholder="عبدالله العتيبي"
            className="input"
            dir="rtl"
          />
        </Field>
        <Field
          label={t("nationalId")}
          required
          hint={t("nationalIdHint")}
          className="md:col-span-2"
        >
          <input
            value={form.nationalId}
            onChange={(e) =>
              set("nationalId", e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="1XXXXXXXXX"
            inputMode="numeric"
            className="input tabular"
            dir="ltr"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Step 2: Contact ────────────────────────────────────────────────────────

function ContactStep({
  t,
  form,
  set,
}: {
  t: (k: string) => string;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="font-semibold">{t("contactTitle")}</h3>
      <p className="text-sm text-muted">{t("contactHint")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("phone")} required hint={t("phoneHint")}>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="05X XXX XXXX"
            className="input tabular"
            dir="ltr"
          />
        </Field>
        <Field label={t("email")} required>
          <input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
            type="email"
            className="input"
            dir="ltr"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Step 3: Risk ───────────────────────────────────────────────────────────

function RiskStep({
  t,
  form,
  set,
}: {
  t: (k: string) => string;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const band =
    form.suitabilityScore < 30
      ? "conservative"
      : form.suitabilityScore < 60
        ? "balanced"
        : form.suitabilityScore < 85
          ? "growth"
          : "aggressive";

  return (
    <div className="space-y-5">
      <h3 className="font-semibold">{t("riskTitle")}</h3>
      <p className="text-sm text-muted">{t("riskHint")}</p>

      <div className="card p-5 bg-cream/30">
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium">{t("suitabilityScore")}</label>
          <span className="text-2xl font-semibold tabular text-deep">
            {form.suitabilityScore}
            <span className="text-xs text-muted font-normal"> / 100</span>
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={form.suitabilityScore}
          onChange={(e) => set("suitabilityScore", Number(e.target.value))}
          className="w-full accent-madkhol-600"
        />
        <div className="flex justify-between text-[10px] text-ash-500 uppercase tracking-wider mt-1">
          <span>{t("conservative")}</span>
          <span>{t("balanced")}</span>
          <span>{t("growth")}</span>
          <span>{t("aggressive")}</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-madkhol-50 text-madkhol-700 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t(`band_${band}`)}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Saudi context + Initial deposit ────────────────────────────────

function ContextStep({
  t,
  form,
  set,
}: {
  t: (k: string) => string;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="font-semibold">{t("contextTitle")}</h3>
      <p className="text-sm text-muted">{t("contextHint")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label={t("hijriYearEnd")}
          hint={t("hijriYearEndHint")}
          required
        >
          <input
            type="date"
            value={form.hijriYearEndIso}
            onChange={(e) => set("hijriYearEndIso", e.target.value)}
            className="input tabular"
            dir="ltr"
          />
        </Field>
        <Field label={t("retireAge")} hint={t("retireAgeHint")} required>
          <input
            type="number"
            min={45}
            max={75}
            value={form.expectedRetireAge}
            onChange={(e) =>
              set("expectedRetireAge", Number(e.target.value))
            }
            className="input tabular"
            dir="ltr"
          />
        </Field>
        <Field
          label={t("monthlyExpense")}
          hint={t("monthlyExpenseHint")}
          required
        >
          <div className="relative">
            <input
              type="number"
              min={1_000}
              max={200_000}
              step={500}
              value={form.monthlyExpenseSar}
              onChange={(e) =>
                set("monthlyExpenseSar", Number(e.target.value))
              }
              className="input tabular pe-12"
              dir="ltr"
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              SAR
            </span>
          </div>
        </Field>
        <Field
          label={t("startingDeposit")}
          hint={t("startingDepositHint")}
          required
        >
          <div className="relative">
            <input
              type="number"
              min={0}
              step={1_000}
              value={form.startingDepositSar}
              onChange={(e) =>
                set("startingDepositSar", Number(e.target.value))
              }
              className="input tabular pe-12"
              dir="ltr"
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              SAR
            </span>
          </div>
        </Field>
      </div>
    </div>
  );
}

// ─── Step 5: Review ─────────────────────────────────────────────────────────

function ReviewStep({
  t,
  form,
  locale,
}: {
  t: (k: string) => string;
  form: FormState;
  locale: string;
}) {
  const band =
    form.suitabilityScore < 30
      ? "conservative"
      : form.suitabilityScore < 60
        ? "balanced"
        : form.suitabilityScore < 85
          ? "growth"
          : "aggressive";

  return (
    <div className="space-y-5">
      <h3 className="font-semibold">{t("reviewTitle")}</h3>
      <p className="text-sm text-muted">{t("reviewHint")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card icon={<UserPlus className="w-4 h-4 text-madkhol-700" />}
              title={t("step_identity")}>
          <KV label={t("name")} v={locale === "ar" ? form.nameAr : form.name} />
          <KV label={t("nationalId")} v={form.nationalId || "—"} mono />
        </Card>

        <Card icon={<ShieldCheck className="w-4 h-4 text-madkhol-700" />}
              title={t("step_contact")}>
          <KV label={t("phone")} v={form.phone} mono />
          <KV label={t("email")} v={form.email} />
        </Card>

        <Card icon={<ShieldCheck className="w-4 h-4 text-madkhol-700" />}
              title={t("step_risk")}>
          <KV
            label={t("suitabilityScore")}
            v={`${form.suitabilityScore} / 100`}
          />
          <KV label={t("band")} v={t(`band_${band}`)} />
        </Card>

        <Card icon={<CalendarHeart className="w-4 h-4 text-madkhol-700" />}
              title={t("step_context")}>
          <KV
            label={t("hijriYearEnd")}
            v={form.hijriYearEndIso}
            mono
          />
          <KV label={t("retireAge")} v={String(form.expectedRetireAge)} />
          <KV
            label={t("monthlyExpense")}
            v={`${fmtSar(form.monthlyExpenseSar)} SAR`}
          />
        </Card>
      </div>

      <div className="card p-5 bg-brand-soft border-madkhol-200 flex items-center gap-4">
        <span className="w-10 h-10 rounded-xl bg-white grid place-items-center text-madkhol-700 shadow-card shrink-0">
          <Wallet className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted">
            {t("startingDeposit")}
          </p>
          <p className="text-xl font-semibold tabular">
            {fmtSar(form.startingDepositSar)}{" "}
            <span className="text-xs text-muted font-normal">SAR</span>
          </p>
        </div>
        <p className="text-xs text-muted max-w-[200px] text-end">
          {t("startingDepositReview")}
        </p>
      </div>
    </div>
  );
}

// ─── Success ────────────────────────────────────────────────────────────────

function SuccessScreen({
  t,
  locale,
  name,
  phone,
  kycToken,
  onView,
  onClose,
}: {
  t: (k: string, values?: Record<string, string | number>) => string;
  locale: string;
  name: string;
  phone: string;
  kycToken: string;
  onView: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Build absolute URL on the client so it matches whatever host the demo is
  // currently being served from (localhost:3000, 3001, ngrok, prod).
  const kycUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/kyc/${kycToken}`
      : `/${locale}/kyc/${kycToken}`;

  const whatsappMessage =
    locale === "ar"
      ? `مرحباً ${name}، يرجى إكمال إجراءات التحقق من الهوية عبر هذا الرابط:\n${kycUrl}`
      : `Hi ${name}, please complete your identity verification at:\n${kycUrl}`;

  // Strip non-digits, prepend country code if needed
  const phoneE164 = phone.replace(/^0/, "966").replace(/\D/g, "");
  const waLink = `https://wa.me/${phoneE164}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(kycUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* silent — older browsers / cross-origin */
    }
  }

  return (
    <div className="p-8 text-center">
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full bg-brand-gradient animate-pulse opacity-30 blur-xl" />
        <div className="relative w-20 h-20 rounded-full bg-brand-gradient grid place-items-center text-white shadow-soft">
          <CheckCircle2 className="w-9 h-9" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{t("successTitle")}</h3>
      <p className="text-sm text-muted max-w-md mx-auto mb-6">
        {t("successBody", { name })}
      </p>

      <div className="card p-4 bg-cream/40 border-madkhol-100 max-w-md mx-auto text-start mb-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-2">
          {t("kycLinkLabel")}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 text-xs font-mono bg-white border border-border rounded-lg px-3 py-2 truncate" dir="ltr">
            {kycUrl}
          </code>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={copy} className="btn-outline flex-1 text-sm">
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t("kycCopied")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t("kycCopy")}
              </>
            )}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient flex-1 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            {t("kycSendWhatsapp")}
          </a>
        </div>
        <p className="text-[11px] text-muted mt-3">{t("kycHint")}</p>
      </div>

      <div className="flex items-center gap-2 justify-center flex-wrap">
        <button onClick={onClose} className="btn-outline">
          {locale === "ar" ? "إغلاق" : "Close"}
        </button>
        <button onClick={onView} className="btn-gradient">
          {t("viewClient")}
        </button>
      </div>
    </div>
  );
}

// ─── Bits ───────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required ? <span className="text-red-500 ms-1">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-muted mt-1">{hint}</p> : null}
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 bg-white">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted mb-3">
        {icon}
        {title}
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function KV({ label, v, mono }: { label: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted text-xs shrink-0">{label}</dt>
      <dd
        className={cn(
          "font-medium text-deep text-end truncate",
          mono && "font-mono tabular text-xs",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
