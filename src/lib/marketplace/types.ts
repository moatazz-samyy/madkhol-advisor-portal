/**
 * Canonical key sets for the Certified Advisor Marketplace.
 *
 * Specializations and languages are stored as JSON arrays of these keys on
 * `AdvisorProfile`. The UI translates each key via the i18n namespace so the
 * label work stays in `messages/{ar,en}.json` and the DB stays compact.
 */

export type Specialization =
  | "retirement_planning"
  | "shariah_investing"
  | "etf_strategies"
  | "mirath_planning"
  | "gosi_integration"
  | "women_clients"
  | "expat_clients"
  | "high_net_worth"
  | "family_offices"
  | "robo_investing"
  | "healthcare_clients"
  | "tech_clients"
  | "beginner_investors"
  | "sukuk_specialist"
  | "growth_equity";

export const ALL_SPECIALIZATIONS: Specialization[] = [
  "retirement_planning",
  "shariah_investing",
  "etf_strategies",
  "mirath_planning",
  "gosi_integration",
  "women_clients",
  "expat_clients",
  "high_net_worth",
  "family_offices",
  "robo_investing",
  "healthcare_clients",
  "tech_clients",
  "beginner_investors",
  "sukuk_specialist",
  "growth_equity",
];

export type Language = "ar" | "en" | "ur" | "fr" | "fil" | "hi";

export const ALL_LANGUAGES: Language[] = ["ar", "en", "ur", "fr", "fil", "hi"];

export type ServiceTier = "full_discretionary" | "advice_only" | "hybrid";

export const ALL_TIERS: ServiceTier[] = [
  "full_discretionary",
  "advice_only",
  "hybrid",
];

export type CertificationStatus = "pending" | "certified" | "suspended";

export type InquiryStatus = "new" | "replied" | "booked" | "closed";

export type Message = {
  from: "user" | "advisor";
  body: string;
  at: string; // ISO timestamp
};
