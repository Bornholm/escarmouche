import { Evaluation, UnitStats, GeneratedUnit, Ability } from "./types";
import { ActionDescription, BattleState, DeploymentState } from "./battle";

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
      lowPower?: boolean,
      /** Escouade adverse — une escouade thématique du catalogue. */
      aiUnits?: UnitStats[]
    ): Promise<BattleState>;

    /**
     * Démarre effectivement la partie, une fois l'interface affichée.
     * `startGame` ne fait que préparer le plateau : sans cet appel, une IA
     * tirée en premier jouerait avant que le joueur n'ait rien vu.
     */
    function beginBattle(): Promise<BattleState>;

    /** Ouvre la phase de déploiement alterné (règles : placement tour à tour). */
    function startDeployment(
      playerUnits: UnitStats[],
      aiUnits: UnitStats[],
      obstacles: { x: number; y: number }[]
    ): Promise<DeploymentState>;
    /**
     * Place l'unité choisie par le joueur ; l'IA répond dans la foulée.
     * `unitIndex` désigne l'unité dans l'escouade — le joueur décide de
     * l'ordre de déploiement.
     */
    function deployUnit(unitIndex: number, x: number, y: number): Promise<DeploymentState>;
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
