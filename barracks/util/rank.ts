import { Rank } from "../types";

/* =============================================================================
   Deux échelles distinctes, qu'il ne faut pas confondre :

   - le COÛT d'une unité : un flottant borné par `Barracks.MaxUnitCost` (30),
     calculé par le moteur à partir des caractéristiques et des capacités ;
   - les POINTS DE RANG (PR) : la valeur discrète du rang atteint (1, 3, 6, 10,
     15), seule monnaie qui compte pour composer une escouade (30 PR maximum).

   Le rang est déduit du coût par les règles floues du moteur, pas par un seuil
   fixe : on ne peut donc pas recalculer l'un depuis l'autre côté front.
   ========================================================================== */

export const RANK_ORDER: Rank[] = [
  Rank.Trooper,
  Rank.Veteran,
  Rank.Elite,
  Rank.Champion,
  Rank.Paragon,
];

/** Repli si le moteur n'a pas encore répondu — remplacé par Barracks.RankPointCosts. */
const FALLBACK_RANK_POINTS: Record<string, number> = {
  [Rank.Trooper]: 1,
  [Rank.Veteran]: 3,
  [Rank.Elite]: 6,
  [Rank.Champion]: 10,
  [Rank.Paragon]: 15,
};

export const rankPoints = (rank?: Rank | string): number => {
  if (!rank) return 0;
  const fromEngine = typeof Barracks !== "undefined" ? Barracks.RankPointCosts : undefined;
  return fromEngine?.[rank] ?? FALLBACK_RANK_POINTS[rank] ?? 0;
};

export const rankIndex = (rank?: Rank | string): number => RANK_ORDER.indexOf(rank as Rank);

/** Segments de la jauge de rangs, proportionnels au coût en PR de chaque rang. */
export const rankLadder = (rank?: Rank | string) => {
  const current = rankIndex(rank);
  return RANK_ORDER.map((r, i) => ({
    rank: r,
    points: rankPoints(r),
    reached: current >= i,
    current: current === i,
  }));
};

/** Le rang suivant, ou undefined si l'unité est déjà Parangon. */
export const nextRank = (rank?: Rank | string): Rank | undefined => {
  const index = rankIndex(rank);
  if (index === -1 || index >= RANK_ORDER.length - 1) return undefined;
  return RANK_ORDER[index + 1];
};

export const maxUnitCost = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.MaxUnitCost : undefined) ?? 30;

export const maxSquadRankPoints = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.MaxSquadRankPoints : undefined) ?? 30;

export const maxSquadSize = (): number =>
  (typeof Barracks !== "undefined" ? Barracks.MaxSquadSize : undefined) ?? 6;

/** Coût affiché : une décimale seulement si elle apporte de l'information. */
export const formatCost = (cost?: number): string => {
  if (cost === undefined || Number.isNaN(cost)) return "—";
  return Number.isInteger(cost) ? String(cost) : cost.toFixed(1);
};
