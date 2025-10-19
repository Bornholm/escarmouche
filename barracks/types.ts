export enum Archetype {
  JackOfAllTrades = "jackofalltrades",
  Tank = "tank",
  Sniper = "sniper",
  Skirmisher = "skirmisher",
  Bruiser = "bruiser",
  GlassCannon = "glasscannon",
}

export enum Rank {
  Trooper = "trooper",
  Veteran = "veteran",
  Elite = "elite",
  Champion = "champion",
  Paragon = "paragon"
}

export interface UnitStats {
  health: number;
  range: number;
  move: number;
  power: number;
  abilities: string[]
}

export interface GeneratedUnit extends UnitStats {
  cost: number;
  rank: Rank;
  archetype: Archetype;
}

export interface Ability {
  id: string;
  label: string;
  description: string;
  cost: number;
}

export interface Unit extends UnitStats {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Squad {
  id: string;
  name: string;
  units: Unit[];
}

export interface Evaluation {
  cost: number;
  rank: string;
}