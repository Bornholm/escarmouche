export interface Unit {
  id: string;
  name: string;
  health: number;
  reach: number;
  move: number;
  attack: number;
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