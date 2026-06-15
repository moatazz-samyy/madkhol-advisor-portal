"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar, fmtGregorian } from "@/lib/format";
import {
  FileText,
  Download,
  Send,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

type Client = { id: string; name: string; nameAr: string; aumSar: number };

const PERIODS = ["monthly", "quarterly", "ytd", "custom"] as const;
const BENCHMARKS = ["tasi", "sp500", "msci_world", "none"] as const;

const SECTIONS = [
  "summary",
  "holdings",
  "transactions",
  "zakat",
  "projection",
] as const;
type Section = (typeof SECTIONS)[number];

export function ReportingView({
  locale,
  advisorName,
  clients,
}: {
  locale: string;
  advisorName: string;
  clients: Client[];
}) {
  const t = useTranslations("reporting");

  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("monthly");
  const [benchmark, setBenchmark] = useState<(typeof BENCHMARKS)[number]>("tasi");
  const [from, setFrom] = useState<string>(() =>
    new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [sections, setSections] = useState<Section[]>([
    "summary",
    "holdings",
    "transactions",
  ]);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{
    client: Client;
    generatedAt: string;
  } | null>(null);
  const [sent, setSent] = useState(false);

  function toggleSection(s: Section) {
    setSections((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );
  }

  async function generate() {
    if (!clientId) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 600)); // mock latency
    const client = clients.find((c) => c.id === clientId);
    if (client) setPreview({ client, generatedAt: new Date().toISOString() });
    setSent(false);
    setGenerating(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1 max-w-2xl">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Builder */}
        <section className="card p-5 space-y-4">
          <div>
            <label className="label">{t("client")}</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "ar" ? c.nameAr : c.name} — {fmtSar(c.aumSar)} SAR
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("period")}</label>
            <div className="grid grid-cols-2 gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl border text-xs font-medium transition",
                    period === p
                      ? "bg-deep border-deep text-white"
                      : "bg-white border-border text-ash-600 hover:border-madkhol-300",
                  )}
                >
                  {t(`period_${p}`)}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">{t("from")}</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="input py-1.5"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label">{t("to")}</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input py-1.5"
                  dir="ltr"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="label">{t("benchmark")}</label>
            <select
              value={benchmark}
              onChange={(e) =>
                setBenchmark(e.target.value as (typeof BENCHMARKS)[number])
              }
              className="input"
            >
              {BENCHMARKS.map((b) => (
                <option key={b} value={b}>
                  {t(`benchmark_${b}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("includeSections")}</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTIONS.map((s) => {
                const on = sections.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSection(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition",
                      on
                        ? "bg-deep border-deep text-white"
                        : "bg-white border-border text-ash-600 hover:border-madkhol-300",
                    )}
                  >
                    {t(`section_${s}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating || !clientId}
            className="btn-gradient w-full"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? t("generating") : t("generate")}
          </button>
        </section>

        {/* Preview */}
        <section>
          {preview ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-madkhol-700" />
                    {t("previewTitle")}
                  </h3>
                  <p className="text-xs text-muted">
                    {t("for")}{" "}
                    {locale === "ar" ? preview.client.nameAr : preview.client.name} ·{" "}
                    {fmtGregorian(new Date(preview.generatedAt), locale as "ar" | "en")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-outline text-xs">
                    <Download className="w-3.5 h-3.5" />
                    {t("downloadPdf")}
                  </button>
                  <button
                    onClick={() => setSent(true)}
                    className={cn(
                      "btn-gradient text-xs",
                      sent && "opacity-70",
                    )}
                  >
                    {sent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("sent")}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t("sendToClient")}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-8 bg-cream/50">
                {/* Mock report paper */}
                <div className="bg-white rounded-2xl shadow-soft border border-border p-10 max-w-3xl mx-auto">
                  <div className="text-center border-b border-border pb-6 mb-6">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-md bg-deep grid place-items-center">
                        <span className="text-white text-xs font-bold">م</span>
                      </span>
                      <span className="font-semibold tracking-tight">Madkhol</span>
                    </div>
                    <h2 className="text-xl font-semibold">
                      {t(`period_${period}`)} · {t(`benchmark_${benchmark}`)}
                    </h2>
                    <p className="text-sm text-muted mt-1">
                      {locale === "ar" ? preview.client.nameAr : preview.client.name}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {sections.map((s) => (
                      <div
                        key={s}
                        className="card p-4 bg-ash-50/40 border-border"
                      >
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                          {t(`section_${s}`)}
                        </h4>
                        <p className="text-xs text-ash-500 leading-relaxed">
                          {locale === "ar"
                            ? "هذا قسم تجريبي. في النسخة الفعلية يُنتج محرّك PDF بيانات الأداء/الموجودات/المعاملات للفترة المختارة."
                            : "Mock section. The real PDF engine fills this with the client's performance / holdings / transactions for the selected period."}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-ash-400 text-center mt-8">
                    {t("footerNote")}
                  </p>
                  <p className="text-[10px] text-ash-400 text-center mt-1">
                    {advisorName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-muted bg-cream/30">
              <FileText className="w-7 h-7 text-ash-300 mx-auto mb-2" />
              <p className="text-sm">
                {locale === "ar"
                  ? "اضبط الإعدادات على اليمين ثم اضغط إنشاء التقرير."
                  : "Configure on the left, then click Generate report."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
