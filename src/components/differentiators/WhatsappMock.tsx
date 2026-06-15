"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  Send,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  FileText,
  Search,
  Settings2,
} from "lucide-react";

type ClientBrief = { id: string; name: string; nameAr: string };
type Preset = "statement" | "zakat" | "rebalance";

type ChatMessage = {
  id: string;
  body: string;
  fromAdvisor: boolean;
  at: string;
  attachment?: { kind: "statement" | "zakat" | "rebalance"; label: string };
};

export function WhatsappMock({
  locale,
  clients,
  preselectedClientId,
  preset,
  advisorName,
  advisorNameAr,
}: {
  locale: string;
  clients: ClientBrief[];
  preselectedClientId: string | null;
  preset: Preset;
  advisorName: string;
  advisorNameAr: string;
}) {
  const t = useTranslations("messages");
  const [activeId, setActiveId] = useState<string | null>(
    preselectedClientId ?? clients[0]?.id ?? null,
  );
  const [draft, setDraft] = useState("");
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [businessNumber] = useState("+966 50 123 4567");
  const advisorDisplay = locale === "ar" ? advisorNameAr : advisorName;

  // Initialize the selected chat with a primed preset message
  useEffect(() => {
    if (!activeId) return;
    setChats((prev) => {
      if (prev[activeId]?.length) return prev;
      const client = clients.find((c) => c.id === activeId);
      if (!client) return prev;
      const firstName = (locale === "ar" ? client.nameAr : client.name).split(" ")[0];
      const presetKey = `preset${preset[0].toUpperCase()}${preset.slice(1)}`;
      const presetText = (
        {
          statement: t("presetStatement", { name: firstName }),
          zakat: t("presetZakat", { name: firstName }),
          rebalance: t("presetRebalance", { name: firstName }),
        } as Record<Preset, string>
      )[preset];
      const attachLabel = {
        statement: locale === "ar" ? "كشف-الحساب-مايو-2026.pdf" : "monthly-statement-may-2026.pdf",
        zakat: locale === "ar" ? "تقرير-الزكاة-1447.pdf" : "zakat-report-1447.pdf",
        rebalance: locale === "ar" ? "ملخص-إعادة-الموازنة.pdf" : "rebalance-summary.pdf",
      }[preset];
      void presetKey; // referenced for potential future logic
      const seed: ChatMessage[] = [
        {
          id: "seed-1",
          body: locale === "ar" ? `السلام عليكم ${firstName}` : `Hi ${firstName},`,
          fromAdvisor: true,
          at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          id: "seed-2",
          body:
            locale === "ar"
              ? "وعليكم السلام، كيف حالك؟"
              : "Hey, how are you?",
          fromAdvisor: false,
          at: new Date(Date.now() - 1000 * 60 * 87).toISOString(),
        },
      ];
      // Add the preset as a typed draft instead of prefilling the conversation
      setDraft(presetText);
      void attachLabel;
      return { ...prev, [activeId]: seed };
    });
  }, [activeId, preset, locale, t, clients]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeId, chats]);

  function send() {
    if (!activeId || !draft.trim()) return;
    const attachLabel = {
      statement: locale === "ar" ? "كشف-الحساب-مايو-2026.pdf" : "monthly-statement-may-2026.pdf",
      zakat: locale === "ar" ? "تقرير-الزكاة-1447.pdf" : "zakat-report-1447.pdf",
      rebalance: locale === "ar" ? "ملخص-إعادة-الموازنة.pdf" : "rebalance-summary.pdf",
    }[preset];
    const msg: ChatMessage = {
      id: String(Date.now()),
      body: draft.trim(),
      fromAdvisor: true,
      at: new Date().toISOString(),
      attachment: { kind: preset, label: attachLabel },
    };
    setChats((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), msg],
    }));
    setDraft("");
    // Simulate auto-reply after 2.5s
    setTimeout(() => {
      const reply: ChatMessage = {
        id: String(Date.now() + 1),
        body:
          locale === "ar"
            ? "وصل، شكراً!"
            : "Got it, thanks!",
        fromAdvisor: false,
        at: new Date().toISOString(),
      };
      setChats((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] ?? []), reply],
      }));
    }, 2500);
  }

  const active = clients.find((c) => c.id === activeId);
  const activeChat = activeId ? chats[activeId] ?? [] : [];

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-end">
            <p className="text-muted">{t("businessNumber")}</p>
            <p className="font-mono tabular text-deep">{businessNumber}</p>
          </div>
          <button className="btn-outline text-xs">
            <Settings2 className="w-3.5 h-3.5" />
            {t("configure")}
          </button>
        </div>
      </header>

      <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[640px]">
        {/* Left: chat list */}
        <aside className="border-e border-border bg-cream/40 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
              <input
                placeholder={t("history")}
                className="input ps-9 py-2 text-sm bg-white"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {clients.map((c) => {
              const isActive = c.id === activeId;
              const initials = (locale === "ar" ? c.nameAr : c.name)
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("");
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-start transition border-b border-border/60",
                      isActive
                        ? "bg-madkhol-50 border-s-2 border-s-madkhol-600"
                        : "hover:bg-white",
                    )}
                  >
                    <span className="w-10 h-10 rounded-full bg-brand-gradient text-white grid place-items-center text-xs font-semibold shrink-0">
                      {initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {locale === "ar" ? c.nameAr : c.name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {t("today")}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right: chat panel */}
        <main className="flex flex-col">
          {active ? (
            <>
              {/* Topbar */}
              <div className="p-3 border-b border-border bg-cream/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-brand-gradient text-white grid place-items-center text-xs font-semibold">
                    {(locale === "ar" ? active.nameAr : active.name)
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <p className="font-medium leading-tight">
                      {locale === "ar" ? active.nameAr : active.name}
                    </p>
                    <p className="text-xs text-muted">
                      {locale === "ar" ? "متصل" : "online"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-ash-500">
                  <button className="btn-ghost p-1.5">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost p-1.5">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost p-1.5">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thread — chat-canvas */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%20viewBox=%220%200%2040%2040%22><circle%20cx=%2220%22%20cy=%2220%22%20r=%221%22%20fill=%22%23D9E0DD%22%20opacity=%220.35%22/></svg>')] bg-cream/30"
              >
                <ul className="space-y-2.5">
                  {activeChat.map((m) => (
                    <li
                      key={m.id}
                      className={cn(
                        "flex",
                        m.fromAdvisor ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl p-3 shadow-card",
                          m.fromAdvisor
                            ? "bg-madkhol-50 text-deep rounded-ee-md"
                            : "bg-white text-deep rounded-es-md",
                        )}
                      >
                        {m.attachment ? (
                          <div className="card bg-white border-border p-3 mb-2 flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-lg bg-madkhol-50 text-madkhol-700 grid place-items-center">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">
                                {m.attachment.label}
                              </p>
                              <p className="text-[10px] text-muted">PDF · 124 KB</p>
                            </div>
                          </div>
                        ) : null}
                        <p className="text-sm whitespace-pre-line">{m.body}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-muted">
                          <span className="tabular">
                            {new Date(m.at).toLocaleTimeString(
                              locale === "ar" ? "ar-SA" : "en-GB",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                          {m.fromAdvisor ? (
                            <CheckCheck className="w-3 h-3 text-madkhol-600" />
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-border bg-white flex items-end gap-2">
                <button className="btn-ghost p-2">
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder={t("typing")}
                  className="input resize-none py-2.5"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  className="btn-gradient px-3 py-2.5 shrink-0"
                  aria-label={t("send")}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-ash-400 py-2 bg-white border-t border-border">
                {locale === "ar"
                  ? "محاكاة لواجهة واتساب الأعمال — لا يتم إرسال أي رسائل فعلية."
                  : "Mock of WhatsApp Business — no real messages are sent."}{" "}
                {advisorDisplay ? `· ${advisorDisplay}` : null}
              </p>
            </>
          ) : (
            <p className="m-auto text-sm text-muted">{t("noChats")}</p>
          )}
        </main>
      </div>
    </div>
  );
}
