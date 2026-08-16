import { Squad, Unit } from "../types";
import { BASE_URL } from "./baseUrl";

/* =============================================================================
   Contenu de départ.

   Objectif : personne n'arrive devant une caserne vide. Quatre escouades
   prêtes à jouer, chacune dans un univers différent — c'est aussi la
   démonstration que le système de règles ne raconte aucun monde : les mêmes
   quatre caractéristiques et les mêmes capacités servent une compagnie de
   chevaliers, un détachement spatial, une ligne napoléonienne et un convoi
   post-apocalyptique.

   Les compositions ont été vérifiées avec le moteur (`core.Evaluate`) :
   chacune tient sous les 30 PR et les 6 unités, avec un peu de marge pour que
   le joueur puisse encore bricoler la sienne.

   Les illustrations viendront plus tard : sans `imageUrl`, la carte affiche
   son état de repli, qui est prévu pour ça.
   ========================================================================== */

export const DefaultUnits: Unit[] = [
  // --- Fantasy · Compagnie de l'Aube ------------------------------- 24 PR --
  {
    id: "knight",
    name: "Templier",
    health: 2, range: 1, move: 1, power: 1,
    imageUrl: `${BASE_URL}/templar_knight.png`,
    abilities: [],
  },
  {
    id: "archer",
    name: "Archer elfe",
    health: 1, range: 2, move: 1, power: 2,
    imageUrl: `${BASE_URL}/elven_archer.png`,
    abilities: [],
  },
  {
    id: "mage",
    name: "Sorcier crépusculaire",
    health: 1, range: 3, move: 2, power: 3,
    imageUrl: `${BASE_URL}/fire_mage.png`,
    abilities: [],
  },
  {
    id: "fantasy-warden",
    name: "Gardien du serment",
    health: 4, range: 1, move: 1, power: 2,
    abilities: ["00008-guardian"],
  },
  {
    id: "fantasy-squire",
    name: "Écuyer",
    health: 2, range: 1, move: 2, power: 1,
    abilities: [],
  },
  {
    id: "fantasy-huntress",
    name: "Chasseresse sylvestre",
    health: 2, range: 2, move: 1, power: 1,
    abilities: [],
  },

  // --- Unité héritée, hors escouade ----------------------------------------
  {
    id: "bruiser",
    name: "Guerrier orc",
    health: 3, range: 1, move: 1, power: 3,
    imageUrl: `${BASE_URL}/orc_warrior.png`,
    abilities: [],
  },

  // --- Science-fiction · Détachement Vanguard ---------------------- 28 PR --
  {
    id: "scifi-heavy",
    name: "Fusilier lourd",
    health: 3, range: 2, move: 1, power: 2,
    abilities: ["00003-suppressing-fire"],
  },
  {
    id: "scifi-scout",
    name: "Éclaireur orbital",
    health: 2, range: 2, move: 3, power: 2,
    abilities: [],
  },
  {
    id: "scifi-tech",
    name: "Technicien de combat",
    health: 2, range: 1, move: 2, power: 1,
    abilities: ["00011-overcharge"],
  },
  {
    id: "scifi-sergeant",
    name: "Sergent d'abordage",
    health: 3, range: 1, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "scifi-drone",
    name: "Drone sentinelle",
    health: 1, range: 2, move: 2, power: 1,
    abilities: [],
  },

  // --- Historique · Ligne de 1812 ---------------------------------- 26 PR --
  {
    id: "hist-grenadier",
    name: "Grenadier de la Garde",
    health: 4, range: 1, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "hist-voltigeur",
    name: "Voltigeur",
    health: 2, range: 2, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "hist-cuirassier",
    name: "Cuirassier",
    health: 3, range: 1, move: 3, power: 2,
    abilities: ["00000-charge"],
  },
  {
    id: "hist-sergeant",
    name: "Sergent de compagnie",
    health: 3, range: 1, move: 1, power: 2,
    abilities: ["00002-defensive-stance"],
  },
  {
    id: "hist-drummer",
    name: "Tambour",
    health: 2, range: 1, move: 2, power: 1,
    abilities: [],
  },
  {
    id: "hist-fusilier",
    name: "Fusilier de ligne",
    health: 2, range: 2, move: 1, power: 1,
    abilities: [],
  },

  // --- Post-apocalyptique · Convoi des Rouilleux ------------------- 28 PR --
  {
    id: "apoc-colossus",
    name: "Colosse de fonte",
    health: 5, range: 1, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "apoc-sharpshooter",
    name: "Tireuse de tôle",
    health: 2, range: 3, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "apoc-scrapper",
    name: "Ferrailleur",
    health: 3, range: 1, move: 2, power: 2,
    abilities: ["00009-sweep"],
  },
  {
    id: "apoc-hound",
    name: "Chien de casse",
    health: 2, range: 1, move: 3, power: 1,
    abilities: [],
  },
  {
    id: "apoc-mechanic",
    name: "Mécano bricoleur",
    health: 2, range: 1, move: 1, power: 1,
    abilities: ["00011-overcharge"],
  },
];

const unit = (id: string): Unit => {
  const found = DefaultUnits.find((u) => u.id === id);
  if (!found) throw new Error(`unité par défaut inconnue : ${id}`);
  return found;
};

export const DefaultSquads: Squad[] = [
  {
    id: "squad-fantasy-dawn",
    name: "Compagnie de l'Aube",
    units: [
      unit("knight"),
      unit("archer"),
      unit("mage"),
      unit("fantasy-warden"),
      unit("fantasy-squire"),
      unit("fantasy-huntress"),
    ],
  },
  {
    id: "squad-scifi-vanguard",
    name: "Détachement Vanguard",
    units: [
      unit("scifi-heavy"),
      unit("scifi-scout"),
      unit("scifi-tech"),
      unit("scifi-sergeant"),
      unit("scifi-drone"),
    ],
  },
  {
    id: "squad-hist-line",
    name: "Ligne de 1812",
    units: [
      unit("hist-grenadier"),
      unit("hist-voltigeur"),
      unit("hist-cuirassier"),
      unit("hist-sergeant"),
      unit("hist-drummer"),
      unit("hist-fusilier"),
    ],
  },
  {
    id: "squad-apoc-convoy",
    name: "Convoi des Rouilleux",
    units: [
      unit("apoc-colossus"),
      unit("apoc-sharpshooter"),
      unit("apoc-scrapper"),
      unit("apoc-hound"),
      unit("apoc-mechanic"),
    ],
  },
];
