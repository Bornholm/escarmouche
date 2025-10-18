import { Unit } from "../types";


export const DefaultUnits: Unit[] = [
  {
    id: "knight",
    name: "Templier",
    health: 2,
    range: 1,
    move: 1,
    power: 1,
    imageUrl: "templar_knight.png",
    customImage: undefined,
    abilities: []
  },
  {
    id: "archer",
    name: "Archer elfe",
    health: 1,
    range: 2,
    move: 1,
    power: 2,
    imageUrl: "elven_archer.png",
    customImage: undefined,
    abilities: []
  },
  {
    id: "mage",
    name: "Sorcier crépusculaire",
    health: 1,
    range: 3,
    move: 2,
    power: 3,
    imageUrl: "fire_mage.png",
    customImage: undefined,
    abilities: []
  },
  {
    id: "bruiser",
    name: "Guerrier orc",
    health: 3,
    range: 1,
    move: 1,
    power: 3,
    imageUrl: "orc_warrior.png",
    customImage: undefined,
    abilities: []
  },
];