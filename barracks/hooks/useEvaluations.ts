import { useEffect, useState } from "react";
import { Evaluation, Unit } from "../types";

/**
 * Évalue un lot d'unités en une passe et indexe le résultat par identifiant.
 *
 * La liste des unités appelle le moteur une fois par unité : on regroupe ici
 * pour ne pas relancer une évaluation à chaque rendu de vignette, et pour
 * pouvoir trier et filtrer sur le rang sans attendre carte par carte.
 */
export const useEvaluations = (units: Unit[]): Record<string, Evaluation> => {
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});

  // La signature ne dépend que de ce qui influe sur le coût : inutile de
  // réévaluer parce qu'une illustration a changé.
  const signature = units
    .map((u) => `${u.id}:${u.health}/${u.range}/${u.power}/${u.move}/${u.abilities?.join("+") ?? ""}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        units.map(async (unit) => {
          try {
            return [unit.id, await Barracks.evaluateUnit(unit)] as const;
          } catch {
            return [unit.id, undefined] as const;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, Evaluation> = {};
      for (const [id, evaluation] of entries) {
        if (evaluation) next[id] = evaluation;
      }
      setEvaluations(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [signature]);

  return evaluations;
};
