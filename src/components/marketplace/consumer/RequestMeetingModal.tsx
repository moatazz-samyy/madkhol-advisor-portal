"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, CheckCircle2, Send } from "lucide-react";
import { createInquiry } from "@/app/[locale]/(consumer)/consumer/actions";
import { RESPONSE_SLA_HOURS } from "@/lib/marketplace/config";
import type { ServiceTier } from "@/lib/marketplace/types";

export function RequestMeetingModal({
  locale,
  profileId,
  advisorName,
  tier,
  onClose,
}: {
  locale: string;
  profileId: string;
  advisorName: string;
  tier: ServiceTier;
  onClose: () => void;
}) {
  const t = useTranslations("marketplace");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !topic.trim()) return;
    setSubmitting(true);
    try {
      await createInquiry({
        advisorProfileId: profileId,
        userName: name,
        userEmail: email,
        selectedTier: tier,
        topic,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-lg shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh] bg-white"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">
            {t("requestModalTitle", { name: advisorName })}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-madkhol-50 grid place-items-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-madkhol-700" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{t("requestSuccessTitle")}</h3>
            <p className="text-sm text-muted max-w-sm mx-auto">
              {t("requestSuccessBody", { name: advisorName, hours: RESPONSE_SLA_HOURS })}
            </p>
            <button onClick={onClose} className="btn-gradient mt-6">
              {t("requestSuccessClose")}
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="card p-3 bg-madkhol-50/40 border-madkhol-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                    {t("requestSelectedTier")}
                  </p>
                  <p className="text-sm font-medium">{t(`tier_${tier}`)}</p>
                </div>
              </div>

              <div>
                <label className="label">{t("requestName")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Saad Al-Otaibi"
                />
              </div>
              <div>
                <label className="label">{t("requestEmail")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label">{t("requestTopic")}</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder={t("requestTopicPlaceholder")}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              <button onClick={onClose} className="btn-outline">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={submit}
                disabled={
                  submitting || !name.trim() || !email.trim() || !topic.trim()
                }
                className="btn-gradient"
              >
                <Send className="w-4 h-4" />
                {submitting ? t("requestSubmitting") : t("requestSubmit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
