/**
 * Mirath (Islamic inheritance) share calculator — simplified for demo.
 *
 * Covers the common nuclear-family case the prompt asks for:
 *   spouse + sons + daughters + parents (any subset).
 *
 * Rules implemented (Quran 4:11–12, standard Sunni Faraid):
 *  - Husband: 1/2 if no children; 1/4 if children
 *  - Wife:    1/4 if no children; 1/8 if children
 *  - Father:  1/6 fixed when children exist; if no children, 1/6 fixed + remainder as asaba
 *  - Mother:  1/6 if children exist (or 2+ siblings, not modelled here);
 *             otherwise 1/3 of the estate (special "Umariyyatan" cases not modelled)
 *  - Sons + daughters take the residuary (asaba), with male:female = 2:1
 *  - If only daughters and no sons: 1 daughter = 1/2; 2+ daughters = 2/3 collectively
 *
 * What we deliberately skip (out of scope for a 1-screen demo):
 *  - Grandparents, siblings, cousins, awl/radd corrections,
 *    Umariyyatan, kalalah, gharrawayn, mushtarakah, etc.
 *
 * The output reflects what's modelled; any case the calculator can't represent
 * collapses to "remainder goes to closest asaba" and is labelled as such in copy.
 */

export type Gender = "male" | "female";

export type FamilyInput = {
  clientGender: Gender;
  spouseAlive: boolean;
  sons: number;
  daughters: number;
  fatherAlive: boolean;
  motherAlive: boolean;
};

export type HeirShare = {
  key: string;
  labelKey: string;     // i18n message key, e.g. "heir_son"
  rationaleKey: string; // i18n message key, e.g. "explainHusbandWithChildren"
  fraction: number;     // share of the estate, 0..1
  count: number;        // how many people share this slot (e.g. 3 sons)
  perPersonFraction: number;
};

export function calculateShares(input: FamilyInput): {
  shares: HeirShare[];
  totalAssigned: number;
  unassignedToResiduary: number;
} {
  const { clientGender, spouseAlive, sons, daughters, fatherAlive, motherAlive } = input;
  const hasChildren = sons > 0 || daughters > 0;
  const shares: HeirShare[] = [];

  // -------- Spouse --------
  if (spouseAlive) {
    if (clientGender === "male") {
      // Surviving spouse is a wife
      const frac = hasChildren ? 1 / 8 : 1 / 4;
      shares.push({
        key: "wife",
        labelKey: "heir_wife",
        rationaleKey: hasChildren ? "explainWifeWithChildren" : "explainWifeNoChildren",
        fraction: frac,
        count: 1,
        perPersonFraction: frac,
      });
    } else {
      // Surviving spouse is a husband
      const frac = hasChildren ? 1 / 4 : 1 / 2;
      shares.push({
        key: "husband",
        labelKey: "heir_husband",
        rationaleKey: hasChildren ? "explainHusbandWithChildren" : "explainHusbandNoChildren",
        fraction: frac,
        count: 1,
        perPersonFraction: frac,
      });
    }
  }

  // -------- Mother --------
  if (motherAlive) {
    const frac = hasChildren ? 1 / 6 : 1 / 3;
    shares.push({
      key: "mother",
      labelKey: "heir_mother",
      rationaleKey: hasChildren ? "explainMotherWithChildren" : "explainMotherNoChildren",
      fraction: frac,
      count: 1,
      perPersonFraction: frac,
    });
  }

  // -------- Father --------
  // Father always gets at least 1/6 when children exist; otherwise we'll model him
  // as residuary too, but expose the 1/6 fardh share for clarity.
  let fatherFardhFrac = 0;
  if (fatherAlive) {
    fatherFardhFrac = 1 / 6;
    shares.push({
      key: "father",
      labelKey: "heir_father",
      rationaleKey: hasChildren ? "explainFatherWithChildren" : "explainFatherNoChildren",
      fraction: fatherFardhFrac,
      count: 1,
      perPersonFraction: fatherFardhFrac,
    });
  }

  // -------- Children --------
  // Residuary share for children (after all fardh deductions).
  const fardhTotal = shares.reduce((s, h) => s + h.fraction, 0);
  let residuary = Math.max(0, 1 - fardhTotal);

  // If no children at all, the father takes the residuary too (asaba).
  if (!hasChildren && fatherAlive && residuary > 0) {
    const fatherEntry = shares.find((s) => s.key === "father");
    if (fatherEntry) {
      fatherEntry.fraction += residuary;
      fatherEntry.perPersonFraction = fatherEntry.fraction;
      residuary = 0;
    }
  }

  if (hasChildren) {
    if (sons > 0) {
      // Sons and daughters share residuary, 2:1
      const units = 2 * sons + daughters;
      const perUnit = residuary / units;
      if (sons > 0) {
        shares.push({
          key: "sons",
          labelKey: "heir_son",
          rationaleKey: "explainResiduary",
          fraction: perUnit * 2 * sons,
          count: sons,
          perPersonFraction: perUnit * 2,
        });
      }
      if (daughters > 0) {
        shares.push({
          key: "daughters",
          labelKey: "heir_daughter",
          rationaleKey: "explainResiduary",
          fraction: perUnit * daughters,
          count: daughters,
          perPersonFraction: perUnit,
        });
      }
      residuary = 0;
    } else if (daughters > 0) {
      // Only daughters — quranic fardh:
      const frac = daughters === 1 ? 1 / 2 : 2 / 3;
      shares.push({
        key: "daughters",
        labelKey: "heir_daughter",
        rationaleKey: "explainResiduary",
        fraction: frac,
        count: daughters,
        perPersonFraction: frac / daughters,
      });
      // Recompute residuary
      const newTotal = shares.reduce((s, h) => s + h.fraction, 0);
      residuary = Math.max(0, 1 - newTotal);
      // Father (if alive) gets the residuary as asaba
      if (fatherAlive && residuary > 0) {
        const fatherEntry = shares.find((s) => s.key === "father");
        if (fatherEntry) {
          fatherEntry.fraction += residuary;
          fatherEntry.perPersonFraction = fatherEntry.fraction;
          residuary = 0;
        }
      }
    }
  }

  const totalAssigned = shares.reduce((s, h) => s + h.fraction, 0);
  return {
    shares,
    totalAssigned,
    unassignedToResiduary: Math.max(0, 1 - totalAssigned),
  };
}
