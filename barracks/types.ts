export enum Archetype {
  Balanced = "balanced",
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
  reach: number;
  move: number;
  attack: number;
  abilities: Ability[]
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
}

export interface Unit extends UnitStats {
  id: string;
  name: string;
  imageUrl?: string;
  customImage?: string; // base64 data URL for custom images
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