/**
 * Mock data + helpers for the Madkhol AI Trading connect surface.
 *
 * The actual AI engine is OUT OF SCOPE for this prompt — this file only
 * supplies:
 *   - getConnection(): per-advisor connection state from the DB
 *   - getMockPerformance(): 12 months of AI vs S&P series for the landing chart
 *   - getMockSuggestions(): the 4-card stub for the suggestions page
 *
 * Replace with the real AI service in a later phase.
 */

import { prisma } from "@/lib/prisma";

export type AiConnection = {
  connected: boolean;
  connectedAt: Date | null;
  engagementLevel: string | null;
};

export async function getConnection(advisorId: string): Promise<AiConnection> {
  const a = await prisma.advisor.findUnique({
    where: { id: advisorId },
    select: { madkholAiConnectedAt: true, madkholAiEngagementLevel: true },
  });
  return {
    connected: Boolean(a?.madkholAiConnectedAt),
    connectedAt: a?.madkholAiConnectedAt ?? null,
    engagementLevel: a?.madkholAiEngagementLevel ?? null,
  };
}

// ─── Performance chart: 12 months, Madkhol AI vs S&P 500 ──────────────────
// Both start at 100. S&P ends ~114 (+14%), AI ends ~119 (+19%) — a steady
// ~5% edge. Realistic-feeling monthly squiggles via small seeded jitter.

export function getMockPerformance() {
  const months = [
    "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
    "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26",
  ];
  const ai: number[]  = [100, 102.3, 104.8, 106.1, 108.7, 110.2, 111.4, 113.8, 115.6, 116.4, 117.9, 119.4];
  const sp: number[]  = [100, 101.5, 103.2, 103.8, 105.6, 106.8, 107.2, 109.1, 110.4, 111.0, 112.6, 114.2];
  return months.map((m, i) => ({
    month: m,
    madkholAi: ai[i],
    sp500: sp[i],
  }));
}

export function getEdgePct() {
  const data = getMockPerformance();
  const last = data[data.length - 1];
  return +((last.madkholAi - last.sp500)).toFixed(1);
}

// ─── Mock trade suggestions for the stub page ────────────────────────────

export type MockSuggestion = {
  id: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  side: "buy" | "sell";
  quantity: number;
  confidencePct: number;
  thesisEn: string;
  thesisAr: string;
  forClientName: string;
  forClientNameAr: string;
};

export function getMockSuggestions(): MockSuggestion[] {
  return [
    {
      id: "ai-sug-1",
      symbol: "SPUS",
      nameEn: "SP Funds S&P 500 Shariah ETF",
      nameAr: "صندوق إس بي للأسهم الأمريكية المتوافقة",
      side: "buy",
      quantity: 50,
      confidencePct: 87,
      thesisEn:
        "Momentum + mean-reversion ensemble: SPUS is 1.2σ below its 50-day moving average while underlying breadth has strengthened. Suggested for the growth sleeve.",
      thesisAr:
        "نموذج زخم + ارتداد إلى المتوسط: SPUS يتداول تحت متوسط 50 يوماً بـ 1.2 انحراف معياري مع تحسن الاتساع. مرشّح لشريحة النمو.",
      forClientName: "Abdullah Al-Qahtani",
      forClientNameAr: "عبدالله القحطاني",
    },
    {
      id: "ai-sug-2",
      symbol: "NVDA",
      nameEn: "NVIDIA Corp.",
      nameAr: "إنفيديا",
      side: "buy",
      quantity: 15,
      confidencePct: 82,
      thesisEn:
        "Sector rotation signal: tech relative strength turned positive vs SPX last week; NVDA earnings beat with raised guidance is being underpriced by the options market.",
      thesisAr:
        "إشارة دوران قطاعي: تحسّن القوة النسبية للتقنية مقابل SPX الأسبوع الماضي؛ نتائج إنفيديا تجاوزت التوقعات ولم تعكسها الخيارات بعد.",
      forClientName: "Fahad Al-Ghamdi",
      forClientNameAr: "فهد الغامدي",
    },
    {
      id: "ai-sug-3",
      symbol: "SPSK",
      nameEn: "SP Funds Dow Jones Global Sukuk ETF",
      nameAr: "صندوق إس بي للصكوك العالمية",
      side: "buy",
      quantity: 120,
      confidencePct: 79,
      thesisEn:
        "Duration tilt: model expects 25bps of curve steepening over the next 8 weeks. SPSK ladder adds yield without taking conventional bond risk.",
      thesisAr:
        "ميل المدّة: يتوقّع النموذج انحداراً للمنحنى بمقدار 25 نقطة أساس خلال 8 أسابيع. سُلَّم SPSK يضيف عائداً بدون مخاطر السندات التقليدية.",
      forClientName: "Saud Al-Mutairi",
      forClientNameAr: "سعود المطيري",
    },
    {
      id: "ai-sug-4",
      symbol: "LLY",
      nameEn: "Eli Lilly & Co.",
      nameAr: "إيلاي ليلي",
      side: "sell",
      quantity: 8,
      confidencePct: 71,
      thesisEn:
        "Profit-taking signal: LLY has compounded 31% YTD, model flags valuation at the 92nd percentile of its 5-year band. Suggested partial trim to lock gains.",
      thesisAr:
        "إشارة جني أرباح: ارتفع سهم LLY بنسبة 31٪ منذ بداية العام؛ يضعه النموذج عند الشريحة 92 لتقييم آخر 5 سنوات. يُقترح تخفيف جزئي لتثبيت المكاسب.",
      forClientName: "Khaled Al-Otaibi",
      forClientNameAr: "خالد العتيبي",
    },
  ];
}
