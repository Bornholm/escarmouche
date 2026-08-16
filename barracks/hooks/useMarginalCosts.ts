import { useEffect, useState } from "react";
import { Unit } from "../types";
import { StatKey } from "../components/Icons";

const STATS: StatKey[] = ["health", "range", "power", "move"];

/**
 * Coût du cran suivant, caractéristique par caractéristique.
 *
 * C'est ce qui permet à l'éditeur d'afficher le prix *avant* de le payer :
 * on interroge le moteur avec la valeur incrémentée et on prend l'écart. Les
 * facteurs de coût sont exponentiels et il existe un bonus de synergie entre
 * Portée et Puissance — l'écart ne peut donc pas être calculé côté front.
 */
export const useMarginalCosts = (
  unit: Unit,
  currentCost: number | undefined
): Partial<Record<StatKey, number>> => {
  const [deltas, setDeltas] = useState<Partial<Record<StatKey, number>>>({});

  const signature = `${unit.health}/${unit.range}/${unit.power}/${unit.move}/${unit.abilities?.join("+") ?? ""}`;

  useEffect(() => {
    if (currentCost === undefined) return;
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        STATS.map(async (stat) => {
          try {
            const probe = await Barracks.evaluateUnit({ ...unit, [stat]: unit[stat] + 1 });
            return [stat, probe.cost - currentCost] as const;
          } catch {
            return [stat, undefined] as const;
          }
        })
      );

      if (cancelled) return;

      const next: Partial<Record<StatKey, number>> = {};
      for (const [stat, delta] of entries) {
        if (delta !== undefined) next[stat] = delta;
      }
      setDeltas(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [signature, currentCost]);

  return deltas;
};
