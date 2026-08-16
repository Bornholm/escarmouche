export type ActionType = "move" | "attack" | "ability";
export type Difficulty = "easy" | "normal" | "hard";

/**
 * Instantané léger du plateau, capturé par le moteur juste après l'application
 * d'une action. C'est la matière première du rejeu : sans ces images, le
 * plateau sauterait directement à l'état final du tour adverse.
 */
export interface BattleFrame {
  controlPointsP1: number;
  controlPointsP2: number;
  units: {
    id: number;
    x: number;
    y: number;
    health: number;
    suppressed: boolean;
    untargetable: boolean;
    overcharged: boolean;
    defensiveStance: boolean;
    guardianOf: number;
  }[];
  actionsLeft: number;
  currentPlayerID: number;
}

export interface ActionDescription {
  index: number;
  type: ActionType;
  abilityID: string;
  sourceUnitID: number;
  targetUnitID: number;
  targetX: number;
  targetY: number;
  label: string;
  /** Renseignés uniquement sur les actions déjà jouées (`recentActions`). */
  playerID?: number;
  frame?: BattleFrame;
}

export interface BattleUnit {
  id: number;
  ownerID: number;
  name: string;
  imageURL: string;
  health: number;
  maxHealth: number;
  range: number;
  power: number;
  move: number;
  abilities: string[];
  x: number;
  y: number;
  suppressed: boolean;
  untargetable: boolean;
  overcharged: boolean;
  defensiveStance: boolean;
  guardianOf: number;
}

export interface BattleState {
  /** false tant que la partie n'a pas été démarrée par `beginBattle`. */
  started: boolean;
  units: BattleUnit[];
  obstacles: { x: number; y: number }[];
  controlPoints: { player: number; ai: number };
  currentPlayerID: number;
  humanPlayerID: number;
  actionsLeft: number;
  isOver: boolean;
  winner: number;
  turn: number;
  validActions: ActionDescription[];
  recentActions: ActionDescription[];
}

/* -----------------------------------------------------------------------------
   Effets transitoires — ce qui se superpose au plateau le temps d'une action.
   Ils ne font pas partie de l'état du jeu : ils naissent d'une différence entre
   deux images et s'éteignent tout seuls.
   -------------------------------------------------------------------------- */
export type EffectKind =
  | "damage"     // nombre flottant au-dessus de la cible
  | "hit"        // flash sur le jeton touché
  | "tracer"     // trait de tir entre deux cases
  | "lunge"      // ruée de l'attaquant vers sa cible (corps-à-corps)
  | "death"      // jeton éliminé
  | "ability";   // signature de capacité

export interface BattleEffect {
  key: string;
  kind: EffectKind;
  x: number;
  y: number;
  /** Origine, pour les effets qui relient deux cases (tracer, lunge). */
  fromX?: number;
  fromY?: number;
  value?: number;
  abilityID?: string;
  unitID?: number;
}


/**
 * État de la phase de déploiement alterné : les règles font placer les unités
 * tour à tour, chaque camp voyant ce que l'autre a posé.
 */
export interface DeploymentState {
  playerPositions: { x: number; y: number }[];
  aiPositions: { x: number; y: number }[];
  obstacles: { x: number; y: number }[];
  playerTotal: number;
  aiTotal: number;
  done: boolean;
}
