/**
 * Marketplace fee + business-rule configuration.
 *
 * Documented here, NOT YET wired to a billing pipeline (Phase 2 — see
 * README "Out of scope"). The marketplace cut is taken from the advisor's
 * AuM fee, not from the retail user. Retail users pay nothing to Madkhol
 * for using the marketplace; the relationship is contractual between advisor
 * and end user.
 */

export const MARKETPLACE_CUT_BPS = 15; // 0.15% of advisor's AuM fee

/**
 * 0.10–0.20% range per spec. Override via env var in production if the deal
 * structure varies per advisor cohort.
 */
export const MARKETPLACE_CUT_BPS_RANGE = { min: 10, max: 20 };

/**
 * Privacy mask for user names shown on the advisor-side inquiries list.
 * "Mohammed Al-Sabah" → "Mohammed A."
 */
export function maskUserName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`;
}

/**
 * Inquiry SLA copy used in the consumer "Request sent" success state.
 * The actual response SLA is enforced by the advisor manually; this is a
 * demo expectation set, not a service guarantee.
 */
export const RESPONSE_SLA_HOURS = 48;
