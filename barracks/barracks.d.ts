import { Evaluation, UnitStats, GeneratedUnit, Ability } from "./types";
import { ActionDescription, BattleState } from "./battle";

declare global {
  namespace Barracks {
    function evaluateUnit(unit: UnitStats): Promise<Evaluation>;
    function generateSquad(): Promise<GeneratedUnit[]>;
    /** Génère une unité visant un coût cible (le rang n'est plus que narratif). */
    function generateUnit(targetCost: number, archetype: string): Promise<GeneratedUnit>;
    function getAvailableAbilities(locale: string): Promise<Ability[]>;
    /**
     * Démarre une partie. `obstacle` est l'emplacement choisi par le joueur
     * pendant la mise en place ; l'IA place le sien.
     */
    function startGame(
      units: UnitStats[],
      difficulty: string,
      obstacle?: { x: number; y: number },
      lowPower?: boolean
    ): Promise<BattleState>;
    function getValidActions(): ActionDescription[];
    function selectAction(index: number): Promise<BattleState>;
    function endGame(): void;

    /** Budget d'escouade en points de coût — l'unique monnaie du jeu. */
    const SquadBudget: number;
    const MaxSquadSize: number;
    const MaxUnitCost: number;
    /** Tours de contrôle exclusif de la zone centrale requis pour gagner. */
    const ControlPointsToWin: number;
    const ObjectiveZone: { x: number; y: number }[];
    const ValidObstaclePositions: { x: number; y: number }[];
  }
}

export { };
