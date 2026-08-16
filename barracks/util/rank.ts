import { Rank } from "../types";

/* =============================================================================
   Le COÛT est l'unique monnaie du jeu : les escouades se composent dans un
   budget de points de coût (`Barracks.SquadBudget`).

   Le RANG n'est qu'un titre narratif dérivé de bandes de coût fixes — il
   habille la carte, il ne se paie pas. L'ancien système à double monnaie
   (coût continu → rang flou → points de rang discrets) détruisait
   l'information : deux unités au même prix d'escouade pouvaient différer de
   50 % en valeur réelle.
   ========================================================================== */

export const RANK_ORDER: Rank[] = [
  Rank.Trooper,
  Rank.Veteran,
  Rank.Elite,
  Rank.Champion,
  Rank.Paragon,
];

/** Bornes hautes des bandes de coût de chaque rang (sur MaxUnitCost = 30). */
export const RANK_COST_CEILINGS: Record<Rank, number> = {
  [Rank.Trooper]: 10,
  [Rank.Veteran]: 16,
  [Rank.Elite]: 22,
  [Rank.Champion]: 27,
  [Rank.Paragon]: 30,
};

/** Gabarits de coût proposés par le générateur aléatoire, un par rang. */
export const RANK_COST_TARGETS: Record<Rank, number> = {
  [Rank.Trooper]: 8,
  [Rank.Veteran]: 14,
  [Rank.Elite]: 20,
  [Rank.Champion]: 26,
  [Rank.Paragon]: 30,
};

export const rankIndex = (rank?: Rank | string): number => RANK_ORDER.indexOf(rank as Rank);

/** Segments de la jauge de rangs, proportionnels à la largeur de chaque bande. */
export const rankLadder = (rank?: Rank | string) => {
  const current = rankIndex(rank);
  let previousCeiling = 0;
  return RANK_ORDER.map((r, i) => {
    const width = RANK_COST_CEILINGS[r] - previousCeiling;
    previousCeiling = RANK_COST_CEILINGS[r];
    return {
      rank: r,
      width,
      reached: current >= i,
      current: current === i,
    };
  });
};

export const maxUnitCost = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.MaxUnitCost : undefined) ?? 30;

export const squadBudget = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.SquadBudget : undefined) ?? 100;

export const maxSquadSize = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.MaxSquadSize : undefined) ?? 6;

/** Coût affiché : une décimale seulement si elle apporte de l'information. */
export const formatCost = (cost?: number): string => {
  if (cost === undefined || Number.isNaN(cost)) return "—";
  return Number.isInteger(cost) ? String(cost) : cost.toFixed(1);
};
