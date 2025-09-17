import { Evaluation, Rank, UnitStats, GeneratedUnit, Archetype } from "./types";

declare global {
  namespace Barracks {
    function evaluateUnit(unit: UnitStats): Promise<Evaluation>;
    function generateSquad(): Promise<GeneratedUnit[]>;
    function generateUnit(rank: string, archetype: string): Promise<GeneratedUnit>;
    const RankPointCosts: Record<string, number>;
    const MaxSquadRankPoints: number;
    const MaxSquadSize: number;
  }
}

export { };