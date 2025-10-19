import { Unit } from "../types";
import { BASE_URL } from "./baseUrl";


export const DefaultUnits: Unit[] = [
  {
    id: "knight",
    name: "Templier",
    health: 2,
    range: 1,
    move: 1,
    power: 1,
    imageUrl: `${BASE_URL}/templar_knight.png`,
    abilities: []
  },
  {
    id: "archer",
    name: "Archer elfe",
    health: 1,
    range: 2,
    move: 1,
    power: 2,
    imageUrl: `${BASE_URL}/elven_archer.png`,
    abilities: []
  },
  {
    id: "mage",
    name: "Sorcier crépusculaire",
    health: 1,
    range: 3,
    move: 2,
    power: 3,
    imageUrl: `${BASE_URL}/fire_mage.png`,
    abilities: []
  },
  {
    id: "bruiser",
    name: "Guerrier orc",
    health: 3,
    range: 1,
    move: 1,
    power: 3,
    imageUrl: `${BASE_URL}/orc_warrior.png`,
    abilities: []
  },
];