/**
 * Formatting helpers tuned for Madkhol's product UI.
 * Number formatters force latin digits so charts/tables stay aligned in both AR and EN.
 */

const sarFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const sarFineFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pctFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmtSar = (n: number) => sarFormatter.format(Math.round(n));
export const fmtSarFine = (n: number) => sarFineFormatter.format(n);
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${pctFormatter.format(n)}%`;
export const fmtUnits = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);

export function relTime(date: Date, locale: "ar" | "en") {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
  const diffMin = Math.round(diffMs / (1000 * 60));
  return rtf.format(diffMin, "minute");
}

export function fmtGregorian(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function fmtHijri(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "islamic-umalqura",
  }).format(date);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400_000);
}
