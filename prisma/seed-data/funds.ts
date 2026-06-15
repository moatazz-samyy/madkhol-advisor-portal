// Curated fund universe for demo seeding.
// Real fund-manager names + plausible (NOT live) NAVs and YTDs. README must label as demo.

export type FundSeed = {
  nameEn: string;
  nameAr: string;
  assetClass: string;
  region: string;
  currency: string;
  fundManager: string;
  shariahCompliant: boolean;
  shariahStatusReason?: string;
  lastKnownNav: number;
  ytdReturn: number;
  fundFeeBps: number;
};

export const FUNDS: FundSeed[] = [
  // -------- SNB Capital — 8 --------
  { nameEn: "SNB Capital Saudi Equity Fund", nameAr: "صندوق الأهلي للأسهم السعودية", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 28.42, ytdReturn: 11.8, fundFeeBps: 175 },
  { nameEn: "SNB Capital Multi-Asset Conservative", nameAr: "صندوق الأهلي متعدد الأصول المحافظ", assetClass: "etf", region: "saudi", currency: "SAR", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 14.07, ytdReturn: 5.4, fundFeeBps: 120 },
  { nameEn: "SNB Capital Sukuk Fund", nameAr: "صندوق الأهلي للصكوك", assetClass: "sukuk", region: "saudi", currency: "SAR", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 11.32, ytdReturn: 4.1, fundFeeBps: 60 },
  { nameEn: "SNB Capital Money Market", nameAr: "صندوق الأهلي للمرابحة", assetClass: "mmf", region: "saudi", currency: "SAR", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 10.18, ytdReturn: 5.2, fundFeeBps: 35 },
  { nameEn: "SNB Capital GCC Equity", nameAr: "صندوق الأهلي لأسهم الخليج", assetClass: "equity", region: "gcc", currency: "USD", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 41.55, ytdReturn: 9.2, fundFeeBps: 150 },
  { nameEn: "SNB Capital Saudi REIT", nameAr: "صندوق الأهلي للريت", assetClass: "reit", region: "saudi", currency: "SAR", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 9.87, ytdReturn: -2.4, fundFeeBps: 100 },
  { nameEn: "SNB Capital Global Equity Index", nameAr: "صندوق الأهلي العالمي للأسهم", assetClass: "equity", region: "global", currency: "USD", fundManager: "SNB Capital", shariahCompliant: false, shariahStatusReason: "Underlying index includes non-compliant financials and entertainment exposure above tolerance.", lastKnownNav: 56.21, ytdReturn: 14.3, fundFeeBps: 90 },
  { nameEn: "SNB Capital Gold ETF", nameAr: "صندوق الأهلي للذهب", assetClass: "commodities", region: "global", currency: "USD", fundManager: "SNB Capital", shariahCompliant: true, lastKnownNav: 22.85, ytdReturn: 18.7, fundFeeBps: 50 },

  // -------- Jadwa — 8 --------
  { nameEn: "Jadwa Saudi Equity Fund", nameAr: "صندوق جدوى للأسهم السعودية", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 35.66, ytdReturn: 13.1, fundFeeBps: 165 },
  { nameEn: "Jadwa Diversified Income", nameAr: "صندوق جدوى المتنوع للدخل", assetClass: "sukuk", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 12.41, ytdReturn: 4.8, fundFeeBps: 75 },
  { nameEn: "Jadwa MENA IPO Fund", nameAr: "صندوق جدوى للاكتتابات", assetClass: "equity", region: "gcc", currency: "USD", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 18.95, ytdReturn: 22.4, fundFeeBps: 200 },
  { nameEn: "Jadwa REIT Fund", nameAr: "صندوق جدوى للريت", assetClass: "reit", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 10.22, ytdReturn: 1.2, fundFeeBps: 110 },
  { nameEn: "Jadwa Murabaha Fund", nameAr: "صندوق جدوى للمرابحة", assetClass: "mmf", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 10.09, ytdReturn: 5.0, fundFeeBps: 40 },
  { nameEn: "Jadwa Global Sukuk Fund", nameAr: "صندوق جدوى للصكوك العالمية", assetClass: "sukuk", region: "global", currency: "USD", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 11.78, ytdReturn: 3.9, fundFeeBps: 85 },
  { nameEn: "Jadwa Saudi Smart Beta", nameAr: "صندوق جدوى الذكي للأسهم", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: true, lastKnownNav: 17.45, ytdReturn: 10.7, fundFeeBps: 140 },
  { nameEn: "Jadwa Pre-IPO Opportunities", nameAr: "صندوق جدوى للفرص قبل الاكتتاب", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Jadwa Investment", shariahCompliant: false, shariahStatusReason: "Holds private companies that have not yet completed Shariah screening.", lastKnownNav: 26.30, ytdReturn: 19.6, fundFeeBps: 250 },

  // -------- Albilad Capital — 7 --------
  { nameEn: "Albilad Saudi Equity", nameAr: "صندوق البلاد للأسهم السعودية", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 19.84, ytdReturn: 12.5, fundFeeBps: 175 },
  { nameEn: "Albilad Sukuk Fund", nameAr: "صندوق البلاد للصكوك", assetClass: "sukuk", region: "saudi", currency: "SAR", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 10.78, ytdReturn: 4.5, fundFeeBps: 65 },
  { nameEn: "Albilad MSCI US Index Fund", nameAr: "صندوق البلاد لمؤشر إم إس سي آي الأمريكي", assetClass: "etf", region: "global", currency: "USD", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 38.45, ytdReturn: 17.8, fundFeeBps: 95 },
  { nameEn: "Albilad Gold Fund", nameAr: "صندوق البلاد للذهب", assetClass: "commodities", region: "global", currency: "USD", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 21.66, ytdReturn: 18.2, fundFeeBps: 55 },
  { nameEn: "Albilad REIT", nameAr: "صندوق البلاد للريت", assetClass: "reit", region: "saudi", currency: "SAR", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 8.94, ytdReturn: -4.8, fundFeeBps: 100 },
  { nameEn: "Albilad Murabaha Fund", nameAr: "صندوق البلاد للمرابحة", assetClass: "mmf", region: "saudi", currency: "SAR", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 10.11, ytdReturn: 5.1, fundFeeBps: 35 },
  { nameEn: "Albilad Income Fund", nameAr: "صندوق البلاد للدخل", assetClass: "sukuk", region: "saudi", currency: "SAR", fundManager: "Albilad Capital", shariahCompliant: true, lastKnownNav: 11.55, ytdReturn: 4.2, fundFeeBps: 70 },

  // -------- Wahed — 7 --------
  { nameEn: "Wahed Saudi Equity", nameAr: "صندوق واحد للأسهم السعودية", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 14.22, ytdReturn: 11.4, fundFeeBps: 160 },
  { nameEn: "Wahed FTSE USA Shariah ETF (HLAL)", nameAr: "صندوق واحد للأسهم الأمريكية المتوافقة", assetClass: "etf", region: "global", currency: "USD", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 48.21, ytdReturn: 16.5, fundFeeBps: 50 },
  { nameEn: "Wahed Dow Jones Sukuk ETF", nameAr: "صندوق واحد للصكوك العالمية", assetClass: "sukuk", region: "global", currency: "USD", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 22.84, ytdReturn: 3.8, fundFeeBps: 65 },
  { nameEn: "Wahed Emerging Markets Shariah", nameAr: "صندوق واحد للأسواق الناشئة", assetClass: "equity", region: "global", currency: "USD", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 19.47, ytdReturn: 7.2, fundFeeBps: 95 },
  { nameEn: "Wahed Gold Fund", nameAr: "صندوق واحد للذهب", assetClass: "commodities", region: "global", currency: "USD", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 23.10, ytdReturn: 19.1, fundFeeBps: 55 },
  { nameEn: "Wahed High-Yield Sukuk", nameAr: "صندوق واحد للصكوك عالية العائد", assetClass: "sukuk", region: "global", currency: "USD", fundManager: "Wahed Invest", shariahCompliant: false, shariahStatusReason: "Recently flagged: 12% of holdings reclassified by shariah board as non-compliant pending replacement.", lastKnownNav: 15.62, ytdReturn: 6.4, fundFeeBps: 110 },
  { nameEn: "Wahed Saudi REIT", nameAr: "صندوق واحد للريت السعودي", assetClass: "reit", region: "saudi", currency: "SAR", fundManager: "Wahed Invest", shariahCompliant: true, lastKnownNav: 9.42, ytdReturn: -1.8, fundFeeBps: 105 },

  // -------- Global ETFs — 20 (under "Global Markets" generic manager labels) --------
  { nameEn: "Vanguard FTSE All-World UCITS", nameAr: "صندوق فانغارد العالمي", assetClass: "etf", region: "global", currency: "USD", fundManager: "Vanguard", shariahCompliant: false, shariahStatusReason: "Diversified index includes financial sector exposure above the 5% screen.", lastKnownNav: 112.45, ytdReturn: 15.8, fundFeeBps: 22 },
  { nameEn: "iShares MSCI World", nameAr: "صندوق آي شيرز العالمي", assetClass: "etf", region: "global", currency: "USD", fundManager: "iShares", shariahCompliant: false, shariahStatusReason: "Non-screened global index.", lastKnownNav: 85.32, ytdReturn: 16.2, fundFeeBps: 25 },
  { nameEn: "iShares MSCI World Islamic UCITS", nameAr: "صندوق آي شيرز العالمي الإسلامي", assetClass: "etf", region: "global", currency: "USD", fundManager: "iShares", shariahCompliant: true, lastKnownNav: 41.18, ytdReturn: 14.4, fundFeeBps: 60 },
  { nameEn: "SP Funds S&P 500 Shariah (SPUS)", nameAr: "صندوق إس بي للأسهم الأمريكية المتوافقة", assetClass: "etf", region: "global", currency: "USD", fundManager: "SP Funds", shariahCompliant: true, lastKnownNav: 47.93, ytdReturn: 17.1, fundFeeBps: 45 },
  { nameEn: "SP Funds Dow Jones Global Sukuk (SPSK)", nameAr: "صندوق إس بي للصكوك العالمية", assetClass: "sukuk", region: "global", currency: "USD", fundManager: "SP Funds", shariahCompliant: true, lastKnownNav: 21.45, ytdReturn: 4.0, fundFeeBps: 55 },
  { nameEn: "SP Funds S&P Global REIT Sharia (SPRE)", nameAr: "صندوق إس بي للريت العالمي", assetClass: "reit", region: "global", currency: "USD", fundManager: "SP Funds", shariahCompliant: true, lastKnownNav: 17.20, ytdReturn: -3.1, fundFeeBps: 65 },
  { nameEn: "iShares Gold Trust (IAU)", nameAr: "صندوق آي شيرز للذهب", assetClass: "commodities", region: "global", currency: "USD", fundManager: "iShares", shariahCompliant: true, lastKnownNav: 51.84, ytdReturn: 19.2, fundFeeBps: 25 },
  { nameEn: "Invesco QQQ Trust", nameAr: "صندوق إنفيسكو كيو كيو كيو", assetClass: "etf", region: "global", currency: "USD", fundManager: "Invesco", shariahCompliant: false, shariahStatusReason: "Tech-heavy index includes companies with non-permissible revenue streams.", lastKnownNav: 481.55, ytdReturn: 21.4, fundFeeBps: 20 },
  { nameEn: "iShares Saudi Arabia ETF (KSA)", nameAr: "صندوق آي شيرز للسوق السعودي", assetClass: "etf", region: "saudi", currency: "USD", fundManager: "iShares", shariahCompliant: true, lastKnownNav: 36.42, ytdReturn: 8.9, fundFeeBps: 74 },
  { nameEn: "Wisdomtree Emerging Markets Islamic", nameAr: "صندوق ويزدوم تري للأسواق الناشئة الإسلامي", assetClass: "etf", region: "global", currency: "USD", fundManager: "WisdomTree", shariahCompliant: true, lastKnownNav: 31.62, ytdReturn: 6.5, fundFeeBps: 75 },
  { nameEn: "SP Funds S&P Global Tech ETF Sharia", nameAr: "صندوق إس بي للتكنولوجيا العالمية", assetClass: "etf", region: "global", currency: "USD", fundManager: "SP Funds", shariahCompliant: true, lastKnownNav: 28.45, ytdReturn: 22.0, fundFeeBps: 55 },
  { nameEn: "Franklin Shariah Global Equity", nameAr: "صندوق فرانكلين الإسلامي العالمي", assetClass: "equity", region: "global", currency: "USD", fundManager: "Franklin Templeton", shariahCompliant: true, lastKnownNav: 22.84, ytdReturn: 13.5, fundFeeBps: 100 },
  { nameEn: "HSBC Islamic Global Equity Index", nameAr: "صندوق إتش إس بي سي الإسلامي العالمي", assetClass: "equity", region: "global", currency: "USD", fundManager: "HSBC", shariahCompliant: true, lastKnownNav: 19.62, ytdReturn: 13.9, fundFeeBps: 80 },
  { nameEn: "iShares Core S&P 500", nameAr: "صندوق آي شيرز إس آند بي 500", assetClass: "etf", region: "global", currency: "USD", fundManager: "iShares", shariahCompliant: false, shariahStatusReason: "Non-screened US large-cap index.", lastKnownNav: 612.15, ytdReturn: 17.2, fundFeeBps: 3 },
  { nameEn: "SPDR Gold Shares (GLD)", nameAr: "صندوق إس بي دي آر للذهب", assetClass: "commodities", region: "global", currency: "USD", fundManager: "State Street", shariahCompliant: true, lastKnownNav: 248.50, ytdReturn: 19.0, fundFeeBps: 40 },
  { nameEn: "Aramco Income Generating REIT", nameAr: "صندوق أرامكو المدر للدخل", assetClass: "reit", region: "saudi", currency: "SAR", fundManager: "Riyad Capital", shariahCompliant: true, lastKnownNav: 9.55, ytdReturn: 2.4, fundFeeBps: 95 },
  { nameEn: "Riyad Equity Fund", nameAr: "صندوق الرياض للأسهم", assetClass: "equity", region: "saudi", currency: "SAR", fundManager: "Riyad Capital", shariahCompliant: true, lastKnownNav: 16.85, ytdReturn: 11.0, fundFeeBps: 165 },
  { nameEn: "Riyad Capital Sukuk Fund", nameAr: "صندوق الرياض للصكوك", assetClass: "sukuk", region: "saudi", currency: "SAR", fundManager: "Riyad Capital", shariahCompliant: true, lastKnownNav: 11.10, ytdReturn: 4.4, fundFeeBps: 70 },
  { nameEn: "Alinma MSCI Saudi Index", nameAr: "صندوق الإنماء لمؤشر السوق السعودي", assetClass: "etf", region: "saudi", currency: "SAR", fundManager: "Alinma Investment", shariahCompliant: true, lastKnownNav: 38.55, ytdReturn: 10.2, fundFeeBps: 60 },
  { nameEn: "Alinma Multi-Asset Income", nameAr: "صندوق الإنماء متعدد الأصول", assetClass: "etf", region: "saudi", currency: "SAR", fundManager: "Alinma Investment", shariahCompliant: true, lastKnownNav: 12.45, ytdReturn: 6.1, fundFeeBps: 110 },
];
