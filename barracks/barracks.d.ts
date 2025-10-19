import { Evaluation, Rank, UnitStats, GeneratedUnit, Archetype } from "./types";

declare global {
  namespace Barracks {
    function evaluateUnit(unit: UnitStats): Promise<Evaluation>;
    function generateSquad(): Promise<GeneratedUnit[]>;
    function generateUnit(rank: string, archetype: string): Promise<GeneratedUnit>;
    function getAvailableAbilities(locale: string): Promise<Ability[]>;
    const RankPointCosts: Record<string, number>;
    const MaxSquadRankPoints: number;
    const MaxSquadSize: number;
    const MaxUnitCost: number;
  }
}

export { };