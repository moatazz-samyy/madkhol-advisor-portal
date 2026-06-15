export const locales = ["ar", "en"] as const;
export const defaultLocale = "ar" as const;
export type Locale = (typeof locales)[number];

export const localeDir: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const localeLabel: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};
