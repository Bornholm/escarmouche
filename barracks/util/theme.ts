/* =============================================================================
   Thème : mode (clair/sombre) et univers (neutre, fantasy…).

   Les deux réglages sont indépendants — chaque univers doit exister dans les
   deux modes — et tous deux se matérialisent par un attribut sur <html>, lu
   par la couche de tokens :

     <html data-mode="dark" data-universe="fantasy">

   Le fichier d'un univers n'est importé que si l'utilisateur le choisit : on
   ne fait pas payer plusieurs couples typographiques à tout le monde.
   ========================================================================== */

export type Mode = "dark" | "light";
export type Universe = "neutral" | "fantasy";

export const UNIVERSES: Universe[] = ["neutral", "fantasy"];

const MODE_KEY = "escarmouche_mode";
const UNIVERSE_KEY = "escarmouche_universe";

/** Chargeurs paresseux, un par univers. `neutral` vit déjà dans tokens.css. */
const universeLoaders: Record<Universe, (() => Promise<unknown>) | null> = {
  neutral: null,
  fantasy: async () => {
    // La police de l'univers arrive avec lui : personne ne paie EB Garamond
    // tant qu'il reste en thème neutre.
    await Promise.all([
      import("@fontsource/eb-garamond/400.css"),
      import("@fontsource/eb-garamond/600.css"),
    ]);
    await import("../styles/theme-fantasy.css");
  },
};

const loaded = new Set<Universe>(["neutral"]);

export const loadMode = (): Mode => {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* localStorage indisponible : on retombe sur la préférence système */
  }
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
};

export const loadUniverse = (): Universe => {
  try {
    const stored = localStorage.getItem(UNIVERSE_KEY);
    if (stored && (UNIVERSES as string[]).includes(stored)) return stored as Universe;
  } catch {
    /* idem */
  }
  return "neutral";
};

export const applyMode = (mode: Mode): void => {
  document.documentElement.dataset.mode = mode;
  document.documentElement.style.colorScheme = mode;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* réglage non persisté, sans conséquence sur le rendu courant */
  }
};

export const applyUniverse = async (universe: Universe): Promise<void> => {
  const loader = universeLoaders[universe];
  if (loader && !loaded.has(universe)) {
    await loader();
    loaded.add(universe);
  }
  document.documentElement.dataset.universe = universe;
  try {
    localStorage.setItem(UNIVERSE_KEY, universe);
  } catch {
    /* idem */
  }
};
