/**
 * Standalone seed for the Certified Advisor Marketplace.
 *
 * Adds 8 new Advisor rows + creates AdvisorProfile rows for all 10 advisors
 * (the 8 new ones + the existing Saad and Sara). Seeds 4 inquiries against
 * Saad's profile in 4 distinct states so the inquiries dashboard demos with
 * content the moment Saad logs in.
 *
 * Idempotent: deletes existing marketplace rows before re-seeding so re-runs
 * during dev never collide on unique constraints.
 *
 * Run with: npx tsx prisma/seed-marketplace.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Specialization, Language } from "../src/lib/marketplace/types";

const prisma = new PrismaClient();

// ─── Advisor portrait paths ────────────────────────────────────────────────
// Local files live in `public/advisors/` and are served at `/advisors/...`.
// Drop the actual JPGs in that folder, then re-run this seed to populate the
// AdvisorProfile.photoUrl column. Falls back to initials if a file is missing.
//
// Mapping advisor → file is deliberately stable so swapping a photo never
// requires touching this file — just overwrite the JPG with the same name.
const PHOTO_BY_EMAIL: Record<string, string> = {
  "advisor1@madkhol.com":        "/advisors/saad.jpg",     // Saad Al-Otaibi
  "advisor2@madkhol.com":        "/advisors/sara.jpg",     // Sara Al-Dosari
  "khalid.qahtani@madkhol.com":  "/advisors/khalid.jpg",   // Khalid Al-Qahtani
  "nora.faisal@madkhol.com":     "/advisors/nora.jpg",     // Nora Al-Faisal
  "ahmed.shehri@madkhol.com":    "/advisors/ahmed.jpg",    // Ahmed Al-Shehri
  "mohammad.ghamdi@madkhol.com": "/advisors/mohammad.jpg", // Mohammad Al-Ghamdi
  "hessa.saud@madkhol.com":      "/advisors/hessa.jpg",    // Hessa Al-Saud
  "omar.anazi@madkhol.com":      "/advisors/omar.jpg",     // Omar Al-Anazi
  "fatima.rashid@madkhol.com":   "/advisors/fatima.jpg",   // Fatima Al-Rashid
  "bandar.mutairi@madkhol.com":  "/advisors/bandar.jpg",   // Bandar Al-Mutairi
};

// ─── 8 NEW advisors (in addition to seeded Saad + Sara) ────────────────────
// Realistic Saudi names with varied specializations to demonstrate range.
type AdvisorSeed = {
  email: string;
  name: string;
  nameAr: string;
  licenseNo: string;
  // Profile payload
  yearsExp: number;
  bio: string;
  bioAr: string;
  philosophy: string;
  philosophyAr: string;
  specializations: Specialization[];
  languages: Language[];
  feeBps: number;
  feeStructure: string;
  feeStructureAr: string;
  totalAumSar: number;
  currentClientCount: number;
};

const NEW_ADVISORS: AdvisorSeed[] = [
  {
    email: "khalid.qahtani@madkhol.com",
    name: "Khalid Al-Qahtani",
    nameAr: "خالد القحطاني",
    licenseNo: "CMA-2024-A-2014",
    yearsExp: 18,
    bio:
      "Eighteen years building retirement plans for senior professionals in Aramco, SABIC, and Ma'aden. I specialize in turning GOSI projections into a real income plan — calculating the gap, designing the bridge, and rebalancing every quarter. Most of my clients reach me 5-10 years before retirement and stay through their first two decades of drawdown. I'm CMA-licensed and a Madkhol-certified advisor.",
    bioAr:
      "ثمانية عشر عاماً في تخطيط التقاعد لمسؤولين من أرامكو وسابك ومعادن. تخصصي تحويل توقعات التأمينات الاجتماعية إلى خطة دخل حقيقية — تحديد الفجوة، تصميم الجسر، إعادة الموازنة كل ربع. يتواصل معي العملاء عادةً قبل التقاعد بـ 5-10 سنوات، ويستمرّون معي خلال أول عقدين من السحب.",
    philosophy:
      "Retirement is a withdrawal problem, not an accumulation problem. The hard math sits in the first ten years — sequence of returns risk is what destroys plans. I tilt my clients' portfolios more conservatively in the 36 months around their retirement date and rebuild risk after the gap is bridged.\n\nI build a 'gap ladder' for every client: a clear cash flow showing each year's required income vs the GOSI payment vs the portfolio drawdown. We update it every quarter against actual spending. The portfolio follows the ladder, not the other way around.\n\nI'm conservative on alternative investments. If we can't explain the position to a 65-year-old in two sentences, we don't own it.",
    philosophyAr:
      "التقاعد مسألة سحب، لا مسألة تجميع. الحساب الصعب يقع في السنوات العشر الأولى — تتابع العوائد هو ما يدمّر الخطط. أميل بمحافظ عملائي إلى التحفظ في الـ 36 شهراً المحيطة بتاريخ التقاعد، ثم أعيد المخاطرة بعد سدّ الفجوة.\n\nأبني «سُلّماً للفجوة» لكل عميل: تدفق نقدي واضح يُظهر دخل كل سنة مقابل راتب التأمينات مقابل السحب من المحفظة. نُحدّثه كل ربع وفق الإنفاق الفعلي.\n\nمتحفظ على الاستثمارات البديلة. إن لم نستطع شرح الصفقة لمتقاعد في الخامسة والستين بجملتين، فلن نشتريها.",
    specializations: ["retirement_planning", "gosi_integration", "high_net_worth"],
    languages: ["ar", "en"],
    feeBps: 100,
    feeStructure: "1.00% AuM/year",
    feeStructureAr: "1.00٪ من الأصول سنوياً",
    totalAumSar: 320_000_000,
    currentClientCount: 28,
  },
  {
    email: "nora.faisal@madkhol.com",
    name: "Nora Al-Faisal",
    nameAr: "نورة الفيصل",
    licenseNo: "CMA-2024-A-1962",
    yearsExp: 14,
    bio:
      "Shariah-only portfolios built around sukuk and screened equity. I work with families who want their investments to align fully with Islamic principles — no compromise, no fund-level workarounds. About 60% of my book is women clients, many of whom prefer working with a woman advisor on family wealth conversations.",
    bioAr:
      "محافظ متوافقة شرعياً بالكامل، مبنيّة على الصكوك والأسهم المفلترة. أعمل مع العائلات التي تريد أن تتوافق استثماراتها تماماً مع المبادئ الإسلامية، دون أي حلول التفافية على مستوى الصندوق. حوالي 60٪ من عملائي نساء، كثيرات منهن يفضّلن العمل مع مستشارة في حوارات الثروة العائلية.",
    philosophy:
      "Shariah-compliance is a constraint, not a constraint set. Done well it removes risks — over-leverage, speculative income, opaque structures — that ought to be removed regardless. The portfolios I build look conservative on paper and have outperformed comparable conventional balanced funds for the last six years.\n\nMy default is heavy on sukuk for the cash-flow ladder and Shariah-screened equity ETFs for growth. Individual stocks only when there's a thesis I can explain in two paragraphs. No private credit, no derivatives, no tobacco/alcohol/conventional banking exposure even at the index level.",
    philosophyAr:
      "الالتزام الشرعي قيد لا قيد عشوائي. حين يُطبّق جيداً، يُزيل مخاطر — الرفع المفرط، الدخل المضارب، الهياكل المعتمة — كان ينبغي إزالتها أصلاً. المحافظ التي أبنيها تبدو متحفظة على الورق، لكنها تفوّقت على نظيراتها التقليدية المتوازنة خلال آخر ست سنوات.\n\nالافتراضي عندي: تركيز كبير على الصكوك لسُلّم الدخل، وصناديق أسهم متوافقة شرعياً للنمو. الأسهم الفردية فقط حين تكون الفرضية شارحة في فقرتين.",
    specializations: ["shariah_investing", "women_clients", "sukuk_specialist", "mirath_planning"],
    languages: ["ar", "en"],
    feeBps: 90,
    feeStructure: "0.90% AuM/year",
    feeStructureAr: "0.90٪ من الأصول سنوياً",
    totalAumSar: 215_000_000,
    currentClientCount: 34,
  },
  {
    email: "ahmed.shehri@madkhol.com",
    name: "Ahmed Al-Shehri",
    nameAr: "أحمد الشهري",
    licenseNo: "CMA-2024-A-1738",
    yearsExp: 25,
    bio:
      "Twenty-five years across HSBC Private Bank, NCB Capital, and now Madkhol's marketplace. Family offices and ultra-high-net-worth individuals — single-family portfolios from SAR 50M up to half a billion. I'm CFA-charterholder, CMA-licensed, and a board member of two Saudi family councils.",
    bioAr:
      "خمسة وعشرون عاماً عبر إتش إس بي سي للخدمات المصرفية الخاصة، الأهلي كابيتال، والآن سوق مدخول. مكاتب عائلية ومستثمرون من فئة الثروات العالية جداً — محافظ عائلية مفردة من 50 مليون إلى نصف مليار ر.س. حاصل على CFA ومرخّص من هيئة السوق المالية، وعضو في مجلسي عائلتين سعوديتين.",
    philosophy:
      "Wealth above SAR 100M behaves differently. The objective shifts from compounding to preserving the family's optionality across generations. I plan in 20-year tranches, hand off each tranche to the next generation's chosen advisor inside the family office, and overlay a Mirath-aware structure on the long-dated assets so estate transitions don't dismantle the position.\n\nI keep exposure to opaque private structures small (<15%) and demand transparency from any GP we work with. Public markets do most of the work; private exposure is a tactical overlay, not a strategy.",
    philosophyAr:
      "الثروة فوق 100 مليون تتصرّف بشكل مختلف. الهدف يتحوّل من المضاعفة إلى الحفاظ على خيارات العائلة عبر الأجيال. أخطّط على شرائح زمنية مدّتها 20 عاماً، أُسلّم كل شريحة لمستشار الجيل التالي داخل المكتب العائلي، وأضع طبقة وعي ميراثي على الأصول طويلة الأمد.\n\nأحافظ على نسبة التعرّض للهياكل الخاصة المعتمة منخفضة (أقل من 15٪).",
    specializations: ["high_net_worth", "family_offices", "mirath_planning"],
    languages: ["ar", "en", "fr"],
    feeBps: 75,
    feeStructure: "0.75% AuM/year (tiered above SAR 100M)",
    feeStructureAr: "0.75٪ من الأصول سنوياً (تنازليّ فوق 100 مليون)",
    totalAumSar: 480_000_000,
    currentClientCount: 9,
  },
  {
    email: "mohammad.ghamdi@madkhol.com",
    name: "Mohammad Al-Ghamdi",
    nameAr: "محمد الغامدي",
    licenseNo: "CMA-2024-A-2186",
    yearsExp: 7,
    bio:
      "ETF-only strategies for cost-conscious investors. I built my book around a simple thesis: in liquid public markets, low fees and tax-efficient diversification beat 90% of advisor stock-picking. My average client pays 25-30 bps total — significantly below the Saudi market median. I work primarily with millennial professionals who want a quiet portfolio they can ignore for ten years.",
    bioAr:
      "استراتيجيات تعتمد على الصناديق المتداولة حصراً، للمستثمرين الذين يهتمون بالتكاليف. بنيت دفتري حول فرضية بسيطة: في الأسواق العامة السائلة، الرسوم المنخفضة والتنويع الذكي يتفوّقان على اختيار الأسهم في 90٪ من الحالات. متوسط العميل عندي يدفع 25-30 نقطة أساس فقط — أقل بكثير من المتوسط السعودي.",
    philosophy:
      "Costs compound just like returns — backwards. A 1% management fee + a 0.7% fund fee = 1.7% drag on a portfolio that might return 7-9% real. That's a quarter of your real return surrendered every year for the privilege of someone trying to beat the market.\n\nI build 5- to 9-position portfolios from low-fee Shariah-compliant ETFs (SPUS, HLAL, SPSK, regional sukuk ETFs, and a small commodities sleeve). Rebalance bands at ±5% rather than calendar dates. Tax-loss harvesting where the client has taxable accounts abroad. That's it. The simplicity is the strategy.",
    philosophyAr:
      "التكاليف تُضاعَف مثل العوائد — لكن في الاتجاه المعاكس. رسوم 1٪ + رسوم صندوق 0.7٪ = خصم 1.7٪ على محفظة قد تعود بـ 7-9٪ حقيقي. هذا ربع عائدك الحقيقي سنوياً ثمناً لمحاولة شخص ما التفوّق على السوق.\n\nأبني محافظ من 5-9 صناديق متداولة منخفضة الرسوم متوافقة شرعياً (SPUS, HLAL, SPSK وصناديق الصكوك الإقليمية).",
    specializations: ["etf_strategies", "robo_investing", "beginner_investors", "tech_clients"],
    languages: ["ar", "en"],
    feeBps: 35,
    feeStructure: "0.35% AuM/year (flat)",
    feeStructureAr: "0.35٪ من الأصول سنوياً (ثابتة)",
    totalAumSar: 78_000_000,
    currentClientCount: 142,
  },
  {
    email: "hessa.saud@madkhol.com",
    name: "Hessa Al-Saud",
    nameAr: "حصة آل سعود",
    licenseNo: "CMA-2024-A-1605",
    yearsExp: 21,
    bio:
      "Twenty-one years working with healthcare professionals: consultants, hospital department heads, private-practice physicians. I understand the specific income shape — late-career start, high earning years 35-55, sharp drop-off after — and design portfolios around it. About 80% of my clients are women working in medicine. CMA-licensed, Madkhol-certified.",
    bioAr:
      "واحد وعشرون عاماً مع كوادر الرعاية الصحية: الاستشاريون، رؤساء الأقسام، أطباء العيادات الخاصة. أفهم شكل الدخل الخاص بهم — البداية المتأخرة، سنوات الذروة 35-55، الانخفاض الحاد بعدها — وأبني المحافظ على هذا الأساس. حوالي 80٪ من عميلاتي نساء يعملن في الطب.",
    philosophy:
      "Healthcare professionals start their earning curve a decade later than most peers, so the time-value of money works against them in the early years. I design 'catch-up' portfolios that take meaningful risk in the 30s and early 40s, then aggressively de-risk in the late 40s.\n\nMalpractice insurance, late-career sabbaticals, and the high incidence of mid-career exits (particularly in surgical specialties) all factor into the plan. My clients tell me I'm one of the few advisors who actually understands their career arc.",
    philosophyAr:
      "كوادر الرعاية الصحية يبدؤون منحنى الدخل بعقد كامل عن أقرانهم، فالقيمة الزمنية للنقود تعمل ضدّهم في السنوات الأولى. أصمّم محافظ «اللحاق بالركب» تأخذ مخاطر حقيقية في الثلاثينات وأوائل الأربعينات، ثم تخفّض المخاطر بقوة في أواخر الأربعينات.",
    specializations: ["healthcare_clients", "women_clients", "retirement_planning"],
    languages: ["ar", "en"],
    feeBps: 95,
    feeStructure: "0.95% AuM/year",
    feeStructureAr: "0.95٪ من الأصول سنوياً",
    totalAumSar: 195_000_000,
    currentClientCount: 41,
  },
  {
    email: "omar.anazi@madkhol.com",
    name: "Omar Al-Anazi",
    nameAr: "عمر العنزي",
    licenseNo: "CMA-2024-A-2241",
    yearsExp: 9,
    bio:
      "Tech and product professionals — STC, Aramco Digital, Saudi startups. Most of my clients have lumpy income (RSUs, bonuses, equity events) and need a portfolio that handles that smoothly. I do equity-heavy growth allocations with deliberate sukuk anchors and explicit liquidity windows around vesting cliffs.",
    bioAr:
      "كوادر التقنية والمنتج — STC، أرامكو الرقمية، الشركات الناشئة السعودية. معظم عملائي لديهم دخل غير منتظم (أسهم مقيّدة، مكافآت، أحداث ملكية) ويحتاجون محفظة تتعامل مع ذلك بسلاسة. أبني تخصيصات تركّز على الأسهم النامية مع ركائز صكوك مدروسة ونوافذ سيولة واضحة حول مواعيد استحقاق الأسهم.",
    philosophy:
      "Equity comp is great until it isn't. The biggest mistake I see in tech clients is concentration — holding 60%+ of net worth in a single employer's stock because 'I work there, I know it.' I won't let a portfolio I manage have more than 15% in any single name, including the client's employer. The discount on diversification is the highest-Sharpe trade in personal finance.\n\nI use a 'three buckets' frame: liquid (next 2 years of expenses + opportunistic capital), growth (long-horizon), and stability (sukuk + cash for sleep-at-night). The growth bucket is where I take real risk; the others stay boring on purpose.",
    philosophyAr:
      "تعويضات الأسهم رائعة حتى تتوقف عن أن تكون كذلك. أكبر خطأ أراه في عملاء التقنية هو التركيز — الاحتفاظ بـ 60٪+ من الثروة الصافية في سهم صاحب العمل لأن «أنا أعمل هناك، أعرفه». لن أسمح بأن تحوي محفظة أديرها أكثر من 15٪ في أي سهم واحد.",
    specializations: ["tech_clients", "growth_equity", "etf_strategies"],
    languages: ["ar", "en"],
    feeBps: 80,
    feeStructure: "0.80% AuM/year + 10% performance above benchmark",
    feeStructureAr: "0.80٪ سنوياً + 10٪ من الأداء فوق المؤشر",
    totalAumSar: 124_000_000,
    currentClientCount: 67,
  },
  {
    email: "fatima.rashid@madkhol.com",
    name: "Fatima Al-Rashid",
    nameAr: "فاطمة الراشد",
    licenseNo: "CMA-2024-A-2298",
    yearsExp: 11,
    bio:
      "Expat-focused practice — I work primarily with mid-career professionals from the GCC, Egypt, Pakistan, and the Philippines who've built careers in Saudi Arabia. The plan needs to navigate Saudi residency, eventual home-country return, multi-currency exposures, and cross-border tax. I speak Arabic, English, Urdu, and Filipino fluently.",
    bioAr:
      "ممارسة موجهة للمقيمين الأجانب — أعمل بشكل رئيسي مع المهنيين في منتصف مسيرتهم من دول الخليج ومصر وباكستان والفلبين، الذين بنوا مسيرتهم في المملكة. الخطة تحتاج إلى التعامل مع الإقامة السعودية، العودة المحتملة لبلد المنشأ، التعرّضات متعددة العملات، والضرائب العابرة للحدود.",
    philosophy:
      "Expat plans live or die on three questions: Where do you go when you retire? What currency do you spend in then? What's the realistic probability you stay? I refuse to assume the answers — we model the three highest-probability scenarios and build a portfolio that doesn't blow up under any of them.\n\nCurrency hedging is critical. Many of my clients have 100% SAR-denominated income and 100% USD-denominated savings; that's an unhedged currency bet they didn't choose. We move them to a deliberate split that matches their likely future spending currency.",
    philosophyAr:
      "خطط المقيمين الأجانب تنجح أو تفشل على ثلاثة أسئلة: إلى أين ستذهب عند التقاعد؟ بأي عملة ستنفق؟ ما الاحتمال الواقعي أن تبقى؟ أرفض افتراض الأجوبة — نُنمذج السيناريوهات الثلاثة الأعلى احتمالاً ونبني محفظة لا تنهار تحت أي منها.",
    specializations: ["expat_clients", "etf_strategies", "retirement_planning"],
    languages: ["ar", "en", "ur", "fil"],
    feeBps: 110,
    feeStructure: "1.10% AuM/year (covers cross-border coordination)",
    feeStructureAr: "1.10٪ سنوياً (يشمل التنسيق العابر للحدود)",
    totalAumSar: 86_000_000,
    currentClientCount: 53,
  },
  {
    email: "bandar.mutairi@madkhol.com",
    name: "Bandar Al-Mutairi",
    nameAr: "بندر المطيري",
    licenseNo: "CMA-2024-A-2402",
    yearsExp: 4,
    bio:
      "Younger advisor focused on first-time investors. My average client age is 28. Most have between SAR 50k and SAR 500k saved — too small for traditional private banking, too large to leave in a Murabaha account. I work in plain language, run quarterly Zoom check-ins, and educate as I go. My goal is to graduate every client to confident self-direction by year five.",
    bioAr:
      "مستشار شاب يركّز على المستثمرين لأول مرة. متوسط عمر العميل عندي 28 سنة. معظمهم وفّر بين 50 ألفاً و500 ألف ر.س — مبلغ صغير على الخدمات المصرفية الخاصة التقليدية، وكبير على تركه في حساب مرابحة. أعمل بلغة بسيطة، أُجري لقاءات ربع سنوية على زووم، وأُعلّم العميل وأنا أبني له خطته. هدفي تخريج كل عميل إلى توجيه ذاتي واثق بحلول السنة الخامسة.",
    philosophy:
      "Most people don't need a complex portfolio. They need to start, automate, and stop checking it every week. My default for a first-year client is monthly auto-investment into 3 ETFs (Shariah Saudi equity, Shariah US equity, Shariah sukuk), a clear emergency fund target, and no individual stocks until they've completed my eight-session investing education.\n\nI bill flat fees, not AuM percentages, because the work is the same whether you have SAR 50k or SAR 500k.",
    philosophyAr:
      "معظم الناس لا يحتاجون محفظة معقّدة. يحتاجون فقط للبدء، للأتمتة، والتوقف عن التحقق منها كل أسبوع. الافتراضي عندي لعميل في سنته الأولى هو استثمار شهري آلي في 3 صناديق متداولة، صندوق طوارئ واضح، وعدم اختيار أسهم فردية حتى يُكمل ثماني جلسات تعليمية.\n\nأحاسب برسوم ثابتة لا بنسبة من الأصول، لأن العمل واحد سواء كان لديك 50 ألفاً أو 500 ألف.",
    specializations: ["beginner_investors", "robo_investing", "etf_strategies"],
    languages: ["ar", "en"],
    feeBps: 50,
    feeStructure: "Flat SAR 2,000/year",
    feeStructureAr: "2٬000 ر.س سنوياً (ثابتة)",
    totalAumSar: 24_000_000,
    currentClientCount: 96,
  },
];

// ─── Profile data for existing Saad + Sara ──────────────────────────────────

const EXISTING_PROFILES: Record<string, {
  yearsExp: number;
  bio: string;
  bioAr: string;
  philosophy: string;
  philosophyAr: string;
  specializations: Specialization[];
  languages: Language[];
  feeBps: number;
  feeStructure: string;
  feeStructureAr: string;
  totalAumSar: number;
  currentClientCount: number;
}> = {
  "advisor1@madkhol.com": {
    yearsExp: 16,
    bio:
      "I've spent the last sixteen years running portfolios for Saudi professionals — across SNB Capital, Jadwa, and now my own practice through Madkhol. My focus is ETF-driven growth strategies for clients who want a clean, transparent portfolio that compounds quietly. CFA-charterholder, CMA-licensed, Madkhol-certified.",
    bioAr:
      "أمضيتُ السنوات الستّ عشرة الأخيرة في إدارة المحافظ لكوادر سعودية — عبر الأهلي كابيتال وجدوى، ثم في ممارستي الخاصة من خلال مدخول. تركيزي على استراتيجيات النمو المدفوعة بالصناديق المتداولة، للعملاء الذين يريدون محفظة نظيفة وشفّافة تنمو بهدوء. حاصل على CFA ومرخّص من هيئة السوق المالية.",
    philosophy:
      "The portfolio should sleep through the night. Clients hire me to remove the second-guessing from their investing — not to add more decisions. My default is a low-cost Shariah-compliant ETF backbone with surgical use of individual positions only when I can defend the thesis to a non-investor in two sentences.\n\nRebalance bands matter more than rebalance dates. I rebalance when an asset class drifts more than 5% from target, not on the calendar. This single rule has added 30-50 bps per year for my book over the last decade.",
    philosophyAr:
      "المحفظة يجب أن تنام مع العميل. يستأجرني العملاء لإزالة التشكيك الثاني من استثماراتهم — لا لإضافة قرارات أخرى. الافتراضي عندي: عمود فقري من صناديق متداولة منخفضة الرسوم متوافقة شرعياً، مع استخدام جراحي للأسهم الفردية فقط حين أستطيع شرح الفرضية لشخص غير مستثمر في جملتين.\n\nنطاقات إعادة الموازنة أهم من تواريخها.",
    specializations: ["etf_strategies", "growth_equity", "retirement_planning", "shariah_investing"],
    languages: ["ar", "en"],
    feeBps: 100,
    feeStructure: "1.00% AuM/year",
    feeStructureAr: "1.00٪ من الأصول سنوياً",
    totalAumSar: 280_000_000,
    currentClientCount: 12,
  },
  "advisor2@madkhol.com": {
    yearsExp: 12,
    bio:
      "Twelve years building family-wealth plans with Saudi women, particularly around Mirath structuring, multi-generational portfolios, and integrated husband-wife planning. Half my book is women, which still makes me unusual in this market — and is exactly why my female clients prefer working with me. CMA-licensed, Madkhol-certified.",
    bioAr:
      "اثنا عشر عاماً في بناء خطط الثروة العائلية مع نساء سعوديات، خاصة حول هيكلة الميراث، المحافظ متعددة الأجيال، والتخطيط المتكامل بين الزوجين. نصف دفتري من النساء، وهذا ما زال غير معتاد في هذا السوق — وهو بالضبط لماذا تفضّل عميلاتي العمل معي.",
    philosophy:
      "Family wealth conversations need to be planned, not improvised. I sit down with each couple individually before any joint meeting, hear what each one needs from the plan privately, and only then synthesize a joint proposal. The most damaging financial decisions I've seen come from one spouse making them on behalf of both.\n\nMirath structure should be modeled before the first investment, not after. I use Madkhol's planner on every active relationship.",
    philosophyAr:
      "حوارات الثروة العائلية تحتاج إلى تخطيط، لا ارتجال. أجلس مع كل زوجين بشكل منفصل قبل أي اجتماع مشترك، أسمع ما يحتاجه كلٌّ منهما من الخطة بشكل خاص، ثم فقط أقوم بصياغة اقتراح مشترك.",
    specializations: ["women_clients", "mirath_planning", "shariah_investing", "high_net_worth"],
    languages: ["ar", "en"],
    feeBps: 95,
    feeStructure: "0.95% AuM/year",
    feeStructureAr: "0.95٪ من الأصول سنوياً",
    totalAumSar: 165_000_000,
    currentClientCount: 22,
  },
};

async function main() {
  console.log("→ Cleaning existing marketplace data...");
  await prisma.marketplaceInquiry.deleteMany();
  await prisma.advisorProfile.deleteMany();
  // Don't delete existing advisors (Saad + Sara) — only marketplace-only ones
  await prisma.advisor.deleteMany({
    where: { email: { in: NEW_ADVISORS.map((a) => a.email) } },
  });

  const passwordHash = await bcrypt.hash("demo123", 8);

  // ─── 1) Insert 8 new Advisor rows (no clients — these are marketplace-only)
  console.log("→ Inserting 8 new marketplace advisors...");
  const createdAdvisors: Record<string, string> = {};
  for (const a of NEW_ADVISORS) {
    const adv = await prisma.advisor.create({
      data: {
        name: a.name,
        nameAr: a.nameAr,
        email: a.email,
        passwordHash,
        brandColor: "#0A2E1F",
        licenseNo: a.licenseNo,
      },
    });
    createdAdvisors[a.email] = adv.id;
  }

  // ─── 2) Profiles for all 10 ────────────────────────────────────────────────
  console.log("→ Creating 10 AdvisorProfile rows (all certified)...");
  const profileSeed = [
    // New 8
    ...NEW_ADVISORS.map((a) => ({
      advisorId: createdAdvisors[a.email],
      bio: a.bio,
      bioAr: a.bioAr,
      philosophy: a.philosophy,
      philosophyAr: a.philosophyAr,
      yearsExperience: a.yearsExp,
      specializations: JSON.stringify(a.specializations),
      languages: JSON.stringify(a.languages),
      feeStructure: a.feeStructure,
      feeBps: a.feeBps,
      totalAumSar: a.totalAumSar,
      currentClientCount: a.currentClientCount,
      averageClientAumSar: a.totalAumSar / Math.max(a.currentClientCount, 1),
      photoUrl: PHOTO_BY_EMAIL[a.email] ?? null,
      visible: true,
      certificationStatus: "certified",
      certifiedAt: new Date(),
      internalRating: 4.2 + Math.random() * 0.6,
    })),
  ];

  // Saad + Sara — look up by email since their ids are seeded earlier
  for (const email of Object.keys(EXISTING_PROFILES)) {
    const advisor = await prisma.advisor.findUnique({ where: { email } });
    if (!advisor) continue;
    const p = EXISTING_PROFILES[email];
    profileSeed.push({
      advisorId: advisor.id,
      bio: p.bio,
      bioAr: p.bioAr,
      philosophy: p.philosophy,
      philosophyAr: p.philosophyAr,
      yearsExperience: p.yearsExp,
      specializations: JSON.stringify(p.specializations),
      languages: JSON.stringify(p.languages),
      feeStructure: p.feeStructure,
      feeBps: p.feeBps,
      totalAumSar: p.totalAumSar,
      currentClientCount: p.currentClientCount,
      averageClientAumSar: p.totalAumSar / Math.max(p.currentClientCount, 1),
      photoUrl: PHOTO_BY_EMAIL[email] ?? null,
      visible: true,
      certificationStatus: "certified",
      certifiedAt: new Date(),
      internalRating: 4.4 + Math.random() * 0.5,
    });
  }

  const profileIds: Record<string, string> = {};
  for (const p of profileSeed) {
    const created = await prisma.advisorProfile.create({ data: p });
    profileIds[p.advisorId] = created.id;
  }

  // ─── 3) Sample inquiries (against Saad's profile so his portal has content)
  const saad = await prisma.advisor.findUnique({
    where: { email: "advisor1@madkhol.com" },
  });
  if (saad && profileIds[saad.id]) {
    console.log("→ Seeding 4 sample inquiries against Saad's profile...");
    const profile = profileIds[saad.id];
    const inquiries = [
      {
        userName: "Mohammed Al-Sabah",
        userEmail: "mohammed.sabah@example.com",
        selectedTier: "advice_only",
        topic: "I'm 38, earning well, no plan. Saved ~SAR 600k. Want to retire by 60 and need to know if I'm on track.",
        status: "new",
        messages: JSON.stringify([
          { from: "user", body: "I'm 38, earning well, no plan. Saved ~SAR 600k. Want to retire by 60 and need to know if I'm on track.", at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString() },
        ]),
      },
      {
        userName: "Lulwa Al-Faisal",
        userEmail: "lulwa.faisal@example.com",
        selectedTier: "hybrid",
        topic: "Looking for a Shariah-compliant portfolio for SAR 1.2M. Currently in a Murabaha account, want growth.",
        status: "replied",
        messages: JSON.stringify([
          { from: "user", body: "Looking for a Shariah-compliant portfolio for SAR 1.2M. Currently in a Murabaha account, want growth.", at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
          { from: "advisor", body: "Mar7aban Lulwa — happy to help. Quick clarifier: is this a single allocation or are you adding monthly contributions? And what's your target horizon? I can sketch a balanced 60/40 Shariah-compliant portfolio after we cover those.", at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString() },
          { from: "user", body: "Single allocation, 10+ year horizon, no monthly additions but no withdrawals either.", at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
        ]),
      },
      {
        userName: "Bandar Al-Subaie",
        userEmail: "bandar.subaie@example.com",
        selectedTier: "full_discretionary",
        topic: "Expat consultant, SAR 850k portfolio, may return to Egypt in 3-5 years. Need someone who understands cross-border.",
        status: "booked",
        messages: JSON.stringify([
          { from: "user", body: "Expat consultant, SAR 850k portfolio, may return to Egypt in 3-5 years. Need someone who understands cross-border.", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
          { from: "advisor", body: "Cross-border planning is delicate — happy to walk through it. I'd actually recommend you also chat with Fatima Al-Rashid on the marketplace; she specializes in your exact case. Want me to make the intro, or do you prefer to proceed with me?", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
          { from: "user", body: "I'd like to meet with you first. Let's schedule.", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 90).toISOString() },
          { from: "advisor", body: "Meeting scheduled for next Tuesday 2 pm Riyadh time via Madkhol video. Confirmation will land in your email.", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
        ]),
      },
      {
        userName: "Hessa Al-Khalifa",
        userEmail: "hessa.k@example.com",
        selectedTier: "advice_only",
        topic: "Small portfolio (SAR 80k), looking for first advisor.",
        status: "closed",
        messages: JSON.stringify([
          { from: "user", body: "Small portfolio (SAR 80k), looking for first advisor.", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
          { from: "advisor", body: "Welcome to Madkhol! For your portfolio size and stage, I'd actually recommend Bandar Al-Mutairi — he specializes in first-time investors and runs a much more cost-efficient setup at this AuM level. Direct profile link: /consumer/advisor/bandar.", at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString() },
        ]),
      },
    ];
    for (const inq of inquiries) {
      await prisma.marketplaceInquiry.create({
        data: {
          advisorProfileId: profile,
          advisorId: saad.id,
          ...inq,
        },
      });
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  const counts = {
    advisors: await prisma.advisor.count(),
    profiles: await prisma.advisorProfile.count(),
    inquiries: await prisma.marketplaceInquiry.count(),
  };
  console.log("✓ Marketplace seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("✗ Marketplace seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
