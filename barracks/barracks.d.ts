import { Evaluation, Rank, UnitStats, GeneratedUnit, Archetype } from "./types";
import { ActionDescription, BattleState } from "./battle";

declare global {
  namespace Barracks {
    function evaluateUnit(unit: UnitStats): Promise<Evaluation>;
    function generateSquad(): Promise<GeneratedUnit[]>;
    function generateUnit(rank: string, archetype: string): Promise<GeneratedUnit>;
    function getAvailableAbilities(locale: string): Promise<Ability[]>;
    function startGame(units: UnitStats[], difficulty: string): Promise<BattleState>;
    function getValidActions(): ActionDescription[];
    function selectAction(index: number): Promise<BattleState>;
    function endGame(): void;
    const RankPointCosts: Record<string, number>;
    const MaxSquadRankPoints: number;
    const MaxSquadSize: number;
    const MaxUnitCost: number;
  }
}

export { };