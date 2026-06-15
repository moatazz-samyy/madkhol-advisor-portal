"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { relTime, fmtGregorian } from "@/lib/format";
import {
  Mail,
  CheckCircle2,
  Calendar,
  X,
  Send,
  Briefcase,
} from "lucide-react";
import type { InquiryStatus, Message } from "@/lib/marketplace/types";
import {
  replyToInquiry,
  scheduleMeeting,
  declineInquiry,
} from "@/app/[locale]/(app)/marketplace/actions";

type InquiryRow = {
  id: string;
  maskedUserName: string; // already masked at the server boundary — see page.tsx
  selectedTier: string;
  topic: string;
  status: InquiryStatus;
  messages: Message[];
  createdAt: string;
};

const STATUS_TONE: Record<InquiryStatus, { bg: string; fg: string }> = {
  new: { bg: "bg-madkhol-50", fg: "text-madkhol-700" },
  replied: { bg: "bg-amber-50", fg: "text-amber-700" },
  booked: { bg: "bg-deep", fg: "text-white" },
  closed: { bg: "bg-ash-100", fg: "text-ash-600" },
};

export function InquiriesView({
  locale,
  inquiries,
}: {
  locale: string;
  inquiries: InquiryRow[];
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(inquiries[0]?.id ?? null);

  const filtered =
    filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);
  const active = filtered.find((i) => i.id === openId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("inquiriesTitle")}</h1>
        <p className="text-muted mt-1 max-w-2xl">{t("inquiriesSubtitle")}</p>
      </header>

      {inquiries.length === 0 ? (
        <div className="card p-14 text-center">
          <Mail className="w-7 h-7 text-ash-300 mx-auto mb-2" />
          <p className="text-muted">{t("inquiriesEmpty")}</p>
        </div>
      ) : (
        <>
          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "new", "replied", "booked", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full border transition",
                  filter === s
                    ? "border-deep bg-deep text-white"
                    : "border-border bg-white text-ash-600 hover:border-madkhol-300",
                )}
              >
                {s === "all" ? t("filterAll") : t(`status_${s}`)}
                <span className="ms-1 text-[10px] opacity-70">
                  {s === "all"
                    ? inquiries.length
                    : inquiries.filter((i) => i.status === s).length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            {/* List */}
            <ul className="card divide-y divide-border max-h-[640px] overflow-y-auto">
              {filtered.map((i) => {
                const tone = STATUS_TONE[i.status];
                const last = i.messages[i.messages.length - 1];
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => setOpenId(i.id)}
                      className={cn(
                        "w-full text-start p-4 transition",
                        i.id === active?.id ? "bg-madkhol-50/30" : "hover:bg-ash-50/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {i.maskedUserName}
                        </span>
                        <span className={cn("badge text-[10px]", tone.bg, tone.fg)}>
                          {t(`status_${i.status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2 mb-1.5">
                        {i.topic}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-ash-400">
                        <span>
                          {t(`tier_${i.selectedTier}`)}
                        </span>
                        <span>{relTime(new Date(last?.at ?? i.createdAt), locale as "ar" | "en")}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Conversation */}
            {active ? (
              <InquiryDetail
                inquiry={active}
                locale={locale}
                onAction={() => startTransition(() => router.refresh())}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function InquiryDetail({
  inquiry,
  locale,
  onAction,
}: {
  inquiry: InquiryRow;
  locale: string;
  onAction: () => void;
}) {
  const t = useTranslations("marketplace");
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState<"reply" | "schedule" | "decline" | null>(null);

  async function reply() {
    if (!replyText.trim()) return;
    setBusy("reply");
    try {
      await replyToInquiry(inquiry.id, replyText);
      setReplyText("");
      onAction();
    } finally {
      setBusy(null);
    }
  }
  async function schedule() {
    setBusy("schedule");
    try {
      await scheduleMeeting(inquiry.id);
      onAction();
    } finally {
      setBusy(null);
    }
  }
  async function decline() {
    if (!confirm(t("declineConfirm"))) return;
    setBusy("decline");
    try {
      await declineInquiry(inquiry.id);
      onAction();
    } finally {
      setBusy(null);
    }
  }

  const closed = inquiry.status === "closed";

  return (
    <div className="card flex flex-col overflow-hidden max-h-[640px]">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold inline-flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-ash-400" />
            {inquiry.maskedUserName}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {t(`tier_${inquiry.selectedTier}`)} ·{" "}
            {t("inquirySent", {
              date: fmtGregorian(new Date(inquiry.createdAt), locale as "ar" | "en"),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={schedule}
            disabled={busy !== null || closed}
            className="btn-outline text-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            {t("inquirySchedule")}
          </button>
          <button
            onClick={decline}
            disabled={busy !== null || closed}
            className="btn-ghost text-xs text-ash-500 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
            {t("inquiryDecline")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 bg-cream/30 space-y-3">
        {inquiry.messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.from === "advisor" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-3 shadow-card",
                m.from === "advisor"
                  ? "bg-madkhol-50 text-deep rounded-ee-md"
                  : "bg-white text-deep rounded-es-md",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-ash-500 mb-1">
                {m.from === "advisor" ? t("messageFromAdvisor") : t("messageFromUser")}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{m.body}</p>
              <p className="text-[10px] text-ash-400 mt-1.5">
                {relTime(new Date(m.at), locale as "ar" | "en")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!closed ? (
        <div className="p-3 border-t border-border bg-white flex items-end gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("replyPlaceholder")}
            rows={2}
            className="input resize-none py-2"
          />
          <button
            onClick={reply}
            disabled={busy === "reply" || !replyText.trim()}
            className="btn-gradient shrink-0 px-3 py-2.5"
          >
            <Send className="w-4 h-4" />
            {busy === "reply" ? t("sendingDots") : t("send")}
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-border bg-ash-50/40 text-center text-xs text-muted">
          <CheckCircle2 className="w-3.5 h-3.5 inline-block me-1" />
          {inquiry.status === "booked" ? t("scheduledMsg") : t("declinedMsg")}
        </div>
      )}
    </div>
  );
}
