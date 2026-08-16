import { useTranslation } from "react-i18next";
import { Ability } from "../types";
import { useAsyncMemo } from "./useAsyncMemo";
import { normalizeLocale } from "../util/locale";

/**
 * Catalogue des capacités disponibles, dans la langue courante.
 * Le moteur renvoie déjà les libellés et descriptions traduits.
 */
export const useAbilities = (): Ability[] | undefined => {
  const { i18n } = useTranslation();
  return useAsyncMemo<Ability[]>(
    () => Barracks.getAvailableAbilities(normalizeLocale(i18n.language)),
    [i18n.language]
  );
};

/** Résout les identifiants portés par une unité en capacités complètes. */
export const resolveAbilities = (
  ids: string[] | undefined,
  catalog: Ability[] | undefined
): Ability[] => {
  if (!ids?.length || !catalog?.length) return [];
  return ids
    .map((id) => catalog.find((a) => a.id === id))
    .filter((a): a is Ability => a !== undefined);
};
