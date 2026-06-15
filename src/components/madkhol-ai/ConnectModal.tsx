"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  X,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { connectMadkholAi } from "@/app/[locale]/(app)/madkhol-ai/actions";

type EngagementLevel = "suggestions_only" | "auto_execute_below_10k";

export function ConnectModal({
  locale,
  onClose,
}: {
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("madkholAi");
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [agreed, setAgreed] = useState(false);
  const [level] = useState<EngagementLevel>("suggestions_only");
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function confirm() {
    setSubmitting(true);
    try {
      await connectMadkholAi(level);
      setStep(3);
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t("modalTitle")}</h2>
              <Stepper step={step} />
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 0 ? (
            <Step1
              agreed={agreed}
              onAgreeChange={setAgreed}
              t={t}
              locale={locale}
            />
          ) : null}
          {step === 1 ? <Step2 t={t} /> : null}
          {step === 2 ? <Step3 t={t} /> : null}
          {step === 3 ? <SuccessStep t={t} locale={locale} onClose={onClose} /> : null}
        </div>

        {step < 3 ? (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
            <button
              onClick={() => (step === 0 ? onClose() : setStep((s) => (s - 1) as 0 | 1 | 2))}
              className="btn-outline"
            >
              {step === 0 ? (
                t("modalCancel")
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  {t("modalBack")}
                </>
              )}
            </button>
            {step === 2 ? (
              <button
                onClick={confirm}
                disabled={submitting}
                className="btn-gradient"
              >
                {submitting ? t("modalConnecting") : t("modalConnect")}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
                disabled={step === 0 && !agreed}
                className="btn-gradient"
              >
                {t("modalNext")}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1 rounded-full transition-all",
            i <= step ? "bg-madkhol-600 w-6" : "bg-ash-200 w-3",
          )}
        />
      ))}
    </div>
  );
}

function Step1({
  agreed,
  onAgreeChange,
  t,
  locale,
}: {
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
  t: (k: string) => string;
  locale: string;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{t("modalStep1Title")}</h3>
      <p className="text-sm text-muted mb-4">{t("modalStep1Body")}</p>

      <div className="card p-4 bg-cream/40 mb-4 max-h-48 overflow-y-auto text-xs text-ash-600 leading-relaxed space-y-2">
        <p>
          {locale === "ar"
            ? "تستخدم خدمة مدخول للتداول الذكي بياناتك التشغيلية فقط داخل البنية التحتية المرخّصة من هيئة السوق المالية. لا تتم مشاركة بيانات العميل مع جهات خارجية لأغراض تدريب النماذج."
            : "Madkhol AI Trading processes your operational data inside our CMA-licensed infrastructure. Client data is never shared with third parties for model training."}
        </p>
        <p>
          {locale === "ar"
            ? "يقع على عاتق المستشار مسؤولية مراجعة كل اقتراح قبل التنفيذ. لا تتحمّل مدخول مسؤولية القرارات الاستثمارية الفردية."
            : "The advisor remains responsible for reviewing every suggestion before execution. Madkhol does not assume liability for individual investment decisions."}
        </p>
        <p>
          {locale === "ar"
            ? "يمكن للمستشار إنهاء الخدمة في أي وقت. ستتم إزالة جميع الأذونات النشطة فوراً."
            : "The advisor may discontinue the service at any time. All active permissions are revoked immediately."}
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-ash-50/60">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="w-4 h-4 accent-madkhol-600"
        />
        <span className="text-sm font-medium">{t("modalAgree")}</span>
      </label>
    </div>
  );
}

function Step2({ t }: { t: (k: string) => string }) {
  return (
    <div>
      <h3 className="font-semibold mb-4">{t("modalStep2Title")}</h3>

      <div className="card p-3 bg-madkhol-50/40 border-madkhol-100 flex items-start gap-3 mb-4">
        <Wallet className="w-4 h-4 text-madkhol-700 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-deep">{t("minInvestmentTitle")}</p>
          <p className="text-muted text-xs mt-0.5">{t("minInvestmentBody")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="card p-4 flex items-start gap-3 cursor-pointer border-madkhol-500 bg-madkhol-50/40">
          <input
            type="radio"
            name="engagement"
            checked
            readOnly
            className="w-4 h-4 mt-0.5 accent-madkhol-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold">{t("modalLevel1Title")}</span>
              <span className="badge-success text-[10px]">
                {t("modalLevel1Default")}
              </span>
            </div>
            <p className="text-xs text-muted">{t("modalLevel1Desc")}</p>
          </div>
        </label>

        <label className="card p-4 flex items-start gap-3 opacity-60 cursor-not-allowed border-border bg-ash-50/40">
          <input
            type="radio"
            name="engagement"
            disabled
            className="w-4 h-4 mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold">{t("modalLevel2Title")}</span>
              <span className="badge-neutral text-[10px] inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t("modalLevel2Tag")}
              </span>
            </div>
            <p className="text-xs text-muted">{t("modalLevel2Desc")}</p>
          </div>
        </label>
      </div>
    </div>
  );
}

function Step3({ t }: { t: (k: string) => string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{t("modalStep3Title")}</h3>
      <p className="text-sm text-muted mb-4">{t("modalStep3Body")}</p>

      <div className="card p-5 bg-brand-soft border-madkhol-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-9 h-9 rounded-xl bg-white text-madkhol-700 grid place-items-center shadow-card shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t("modalLevel1Title")}</p>
            <p className="text-xs text-muted">{t("modalLevel1Desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessStep({
  t,
  locale,
  onClose,
}: {
  t: (k: string) => string;
  locale: string;
  onClose: () => void;
}) {
  return (
    <div className="py-6 text-center">
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full bg-brand-gradient animate-pulse opacity-30 blur-xl" />
        <div className="relative w-20 h-20 rounded-full bg-brand-gradient grid place-items-center text-white shadow-soft">
          <CheckCircle2 className="w-9 h-9" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{t("modalSuccessTitle")}</h3>
      <p className="text-sm text-muted mb-6 max-w-md mx-auto">
        {t("modalSuccessBody")}
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button onClick={onClose} className="btn-outline">
          {t("modalDone")}
        </button>
        <Link
          href={`/${locale}/madkhol-ai/suggestions`}
          className="btn-gradient"
          onClick={onClose}
        >
          <Sparkles className="w-4 h-4" />
          {t("modalGoToSuggestions")}
        </Link>
      </div>
    </div>
  );
}
