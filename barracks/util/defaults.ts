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
   chacune tient sous les 100 points et les 6 unités, avec un peu de marge pour
   que le joueur puisse encore bricoler la sienne.

   À elles quatre, elles couvrent les 12 capacités du jeu : chaque escouade en
   porte trois ou quatre, choisies pour leur univers. Découvrir le jeu par les
   escouades par défaut, c'est donc rencontrer l'intégralité du répertoire
   tactique, et pas seulement l'attaque et le mouvement.

   Les quatre escouades sont intégralement illustrées (style TCG,
   cf. docs/illustration-prompts/) — chacune avec sa palette d'univers :
   or pâle, cyan acier, bleu impérial, orange rouille.
   ========================================================================== */

export const DefaultUnits: Unit[] = [
  // --- Fantasy · Compagnie de l'Aube ------------------------------ 99 pts --
  {
    id: "knight",
    quote: "« Mon serment est plus vieux que vos murailles. »",
    name: "Templier",
    health: 4, range: 1, move: 2, power: 1,
    imageUrl: `${BASE_URL}/fantasy-templar.webp`,
    abilities: [],
  },
  {
    id: "archer",
    quote: "« La flèche est partie avant que tu ne poses la question. »",
    name: "Archer elfe",
    health: 2, range: 2, move: 2, power: 2,
    imageUrl: `${BASE_URL}/fantasy-archer.webp`,
    abilities: [],
  },
  {
    id: "mage",
    quote: "« Le crépuscule n'est pas une heure. C'est un endroit. »",
    name: "Sorcier crépusculaire",
    health: 2, range: 3, move: 2, power: 3,
    imageUrl: `${BASE_URL}/fantasy-mage.webp`,
    abilities: ["00001-energy-trait"],
  },
  {
    id: "fantasy-warden",
    quote: "« Frappe-le, et c'est moi que tu trouveras. »",
    imageUrl: `${BASE_URL}/fantasy-warden.webp`,
    name: "Gardien du serment",
    health: 4, range: 1, move: 2, power: 2,
    abilities: ["00008-guardian"],
  },
  {
    id: "fantasy-squire",
    quote: "« Prenez ma place, messire. Moi, on ne me vise pas encore. »",
    imageUrl: `${BASE_URL}/fantasy-squire.webp`,
    name: "Écuyer",
    health: 3, range: 1, move: 2, power: 1,
    abilities: ["00007-feint"],
  },
  // --- Unités héritées, hors escouade --------------------------------------
  // La mesure d'équilibrage (docs/20260817_dominant-strategy.md) a montré que
  // les escouades de 6 unités sont structurellement pénalisées par l'économie
  // d'actions : toutes les escouades livrées jouent à 5. Ces unités restent
  // disponibles pour les compositions personnalisées.
  {
    id: "fantasy-huntress",
    quote: "« La forêt m'a appris à attendre. Vos armées, à viser. »",
    imageUrl: `${BASE_URL}/fantasy-huntress.webp`,
    name: "Chasseresse sylvestre",
    health: 2, range: 2, move: 2, power: 1,
    abilities: [],
  },
  {
    id: "bruiser",
    quote: "« Cogner d'abord. Les questions, c'est pour les survivants. »",
    name: "Guerrier orc",
    health: 3, range: 1, move: 1, power: 3,
    imageUrl: `${BASE_URL}/fantasy-bruiser.webp`,
    abilities: [],
  },

  // --- Science-fiction · Détachement Vanguard -------------------- 100 pts --
  {
    id: "scifi-heavy",
    quote: "« Zone verrouillée. Personne ne traverse mon couloir de tir. »",
    imageUrl: `${BASE_URL}/scifi-heavy.webp`,
    name: "Fusilier lourd",
    health: 4, range: 2, move: 2, power: 2,
    abilities: ["00003-suppressing-fire"],
  },
  {
    id: "scifi-scout",
    quote: "« J'ai vu votre plan d'en haut. Il est déjà obsolète. »",
    imageUrl: `${BASE_URL}/scifi-scout.webp`,
    name: "Éclaireur orbital",
    health: 3, range: 2, move: 3, power: 2,
    abilities: ["00010-precision-shot"],
  },
  {
    id: "scifi-tech",
    quote: "« Les limites constructeur ? Je les ai désactivées. »",
    imageUrl: `${BASE_URL}/scifi-tech.webp`,
    name: "Technicien de combat",
    health: 2, range: 1, move: 2, power: 2,
    abilities: ["00011-overcharge"],
  },
  {
    id: "scifi-sergeant",
    quote: "« On avance ensemble, ou on ne rentre pas du tout. »",
    imageUrl: `${BASE_URL}/scifi-sergeant.webp`,
    name: "Sergent d'abordage",
    health: 3, range: 1, move: 2, power: 2,
    abilities: [],
  },
  {
    id: "scifi-drone",
    quote: "« UNITÉ 7-K : AUCUNE PEUR DÉTECTÉE. AUCUNE, JAMAIS. »",
    imageUrl: `${BASE_URL}/scifi-drone.webp`,
    name: "Drone sentinelle",
    health: 2, range: 2, move: 2, power: 1,
    abilities: [],
  },

  // --- Historique · Ligne de 1812 --------------------------------- 99 pts --
  {
    id: "hist-grenadier",
    quote: "« La Garde meurt, monsieur. Elle ne recule pas. »",
    imageUrl: `${BASE_URL}/hist-grenadier.webp`,
    name: "Grenadier de la Garde",
    health: 6, range: 1, move: 2, power: 2,
    abilities: [],
  },
  {
    id: "hist-voltigeur",
    quote: "« Je tire, je disparais. La fumée fait le reste. »",
    imageUrl: `${BASE_URL}/hist-voltigeur.webp`,
    name: "Voltigeur",
    health: 2, range: 2, move: 1, power: 2,
    abilities: ["00004-tactical-retreat"],
  },
  {
    id: "hist-cuirassier",
    quote: "« Quand le sol tremble, c'est que nous arrivons. »",
    imageUrl: `${BASE_URL}/hist-cuirassier.webp`,
    name: "Cuirassier",
    health: 3, range: 1, move: 3, power: 2,
    abilities: ["00000-charge"],
  },
  {
    id: "hist-sergeant",
    quote: "« Tenez la ligne ! La ligne, c'est tout ce qu'on a. »",
    imageUrl: `${BASE_URL}/hist-sergeant.webp`,
    name: "Sergent de compagnie",
    health: 4, range: 1, move: 1, power: 2,
    abilities: ["00002-defensive-stance"],
  },
  {
    id: "hist-drummer",
    quote: "« Tant que le tambour bat, la compagnie existe. »",
    imageUrl: `${BASE_URL}/hist-drummer.webp`,
    name: "Tambour",
    health: 3, range: 1, move: 2, power: 1,
    abilities: ["00005-command-forward"],
  },
  {
    id: "hist-fusilier",
    quote: "« Trois rangs, une salve, et le monde change de camp. »",
    imageUrl: `${BASE_URL}/hist-fusilier.webp`,
    name: "Fusilier de ligne",
    health: 2, range: 2, move: 2, power: 1,
    abilities: [],
  },

  // --- Post-apocalyptique · Convoi des Rouilleux ------------------ 99 pts --
  {
    id: "apoc-colossus",
    quote: "« Ils m'ont soudé pour durer. Pas pour reculer. »",
    imageUrl: `${BASE_URL}/apoc-colossus.webp`,
    name: "Colosse de fonte",
    health: 5, range: 1, move: 2, power: 2,
    abilities: ["00006-devastating-strike"],
  },
  {
    id: "apoc-sharpshooter",
    quote: "« Une balle, une boîte de conserve. Je ne gaspille ni l'une ni l'autre. »",
    imageUrl: `${BASE_URL}/apoc-sharpshooter.webp`,
    name: "Tireuse de tôle",
    health: 3, range: 3, move: 1, power: 2,
    abilities: [],
  },
  {
    id: "apoc-scrapper",
    quote: "« Tout se répare. Sauf ce que je viens de faucher. »",
    imageUrl: `${BASE_URL}/apoc-scrapper.webp`,
    name: "Ferrailleur",
    health: 4, range: 1, move: 2, power: 2,
    abilities: ["00009-sweep"],
  },
  {
    id: "apoc-hound",
    quote: "« Il ne mord que sur ordre. L'ordre vient vite. »",
    imageUrl: `${BASE_URL}/apoc-hound.webp`,
    name: "Chien de casse",
    health: 2, range: 1, move: 3, power: 1,
    abilities: [],
  },
  {
    id: "apoc-mechanic",
    quote: "« Ça tient avec du fil de fer et de la foi. Surtout du fil de fer. »",
    imageUrl: `${BASE_URL}/apoc-mechanic.webp`,
    name: "Mécano bricoleur",
    health: 2, range: 1, move: 2, power: 1,
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
    description:
      "Dernier ordre survivant du royaume d'Herelm, la Compagnie ne se bat plus pour un trône mais pour un serment : que l'aube se lève encore. Chevaliers, archers et sorciers y marchent côte à côte, unis par la mémoire de la ville qu'ils n'ont pas pu sauver.",
    units: [
      unit("knight"),
      unit("archer"),
      unit("mage"),
      unit("fantasy-warden"),
      unit("fantasy-squire"),
    ],
  },
  {
    id: "squad-scifi-vanguard",
    name: "Détachement Vanguard",
    description:
      "Fer de lance de la flotte coloniale, le Vanguard est déployé là où les cartes s'arrêtent. Doctrine simple : verrouiller le terrain, saturer les lignes, ne jamais laisser un homme — ni un drone — derrière.",
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
    description:
      "Vétérans de dix campagnes, ils ont traversé l'Europe au pas de charge et en sont revenus avec une seule certitude : une ligne qui tient vaut tous les empires. Le tambour donne le rythme, la Garde donne l'exemple.",
    units: [
      unit("hist-grenadier"),
      unit("hist-voltigeur"),
      unit("hist-cuirassier"),
      unit("hist-sergeant"),
      unit("hist-drummer"),
    ],
  },
  {
    id: "squad-apoc-convoy",
    name: "Convoi des Rouilleux",
    description:
      "Après la Chute, les routes appartiennent à ceux qui savent souder. Le Convoi écume les ruines en famille : un colosse de fonte ouvre la voie, la tireuse couvre, le chien renifle les embuscades, et le mécano garde tout ce petit monde en un seul morceau.",
    units: [
      unit("apoc-colossus"),
      unit("apoc-sharpshooter"),
      unit("apoc-scrapper"),
      unit("apoc-hound"),
      unit("apoc-mechanic"),
    ],
  },
];
