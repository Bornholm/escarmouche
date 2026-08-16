import { useCallback, useEffect, useRef, useState } from "react";
import { ActionDescription, BattleEffect, BattleFrame, BattleState, BattleUnit } from "../battle";

/* =============================================================================
   Rejeu du plateau.

   Le moteur ne rend la main au joueur qu'une fois SON action jouée et le tour
   adverse terminé : l'état reçu est déjà le résultat final. Rejouer, c'est
   dérouler à l'écran les images intermédiaires que le moteur joint à chaque
   action (`recentActions[].frame`), au lieu de téléporter le plateau.

   Le hook expose un état d'affichage — distinct de l'état de jeu — et une
   liste d'effets transitoires nés de la différence entre deux images.
   ========================================================================== */

const DURATIONS: Record<string, number> = {
  move: 300,
  attack: 520,
  ability: 560,
};

/** Le repos entre deux actions : sans lui, un tour d'IA est illisible. */
const BEAT = 120;

/**
 * Une entrée d'historique conserve les NOMS résolus au moment de l'action :
 * une unité éliminée disparaît du plateau, mais son nom doit rester lisible
 * dans l'historique. Le libellé lui-même est composé à l'affichage, pour
 * rester traduit et pour parler en repères de case ("A2") plutôt qu'en
 * coordonnées brutes.
 */
export interface ReplayLogEntry {
  turn: number;
  type: string;
  playerID: number;
  abilityID: string;
  targetX: number;
  targetY: number;
  sourceID: number;
  targetID: number;
  sourceName: string;
  targetName: string;
}

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Les unités de l'IA n'ont pas de nom propre : l'affichage s'en charge. */
const nameOf = (units: BattleUnit[], id: number): string => {
  const unit = units.find((u) => u.id === id);
  return unit?.name?.trim() ?? "";
};

const toLogEntry = (
  units: BattleUnit[],
  action: ActionDescription,
  turn: number
): ReplayLogEntry => ({
  turn,
  type: action.type,
  playerID: action.playerID ?? -1,
  abilityID: action.abilityID,
  targetX: action.targetX,
  targetY: action.targetY,
  sourceID: action.sourceUnitID,
  targetID: action.targetUnitID,
  sourceName: nameOf(units, action.sourceUnitID),
  targetName: nameOf(units, action.targetUnitID),
});

/** Fusionne une image de rejeu dans les unités d'affichage. */
const applyFrame = (units: BattleUnit[], frame: BattleFrame): BattleUnit[] => {
  const byId = new Map(frame.units.map((u) => [u.id, u]));
  return units
    .filter((unit) => byId.has(unit.id)) // les unités éliminées quittent le plateau
    .map((unit) => {
      const next = byId.get(unit.id)!;
      return { ...unit, ...next };
    });
};

export const useBattleReplay = (state: BattleState | null) => {
  const [display, setDisplay] = useState<BattleUnit[]>([]);
  const [actionsLeft, setActionsLeft] = useState(2);
  const [effects, setEffects] = useState<BattleEffect[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionDescription | null>(null);
  const [log, setLog] = useState<ReplayLogEntry[]>([]);

  // Incrémenté à chaque nouvel état : toute séquence en cours devient caduque.
  const runId = useRef(0);
  const effectKey = useRef(0);

  const pushEffects = useCallback((next: BattleEffect[], ttl: number) => {
    if (next.length === 0) return;
    setEffects((prev) => [...prev, ...next]);
    const keys = new Set(next.map((e) => e.key));
    setTimeout(() => setEffects((prev) => prev.filter((e) => !keys.has(e.key))), ttl);
  }, []);

  /** Effets déduits de la différence entre l'affichage courant et l'image suivante. */
  const diffEffects = useCallback(
    (before: BattleUnit[], frame: BattleFrame, action: ActionDescription): BattleEffect[] => {
      const out: BattleEffect[] = [];
      const key = () => `fx-${effectKey.current++}`;
      const beforeById = new Map(before.map((u) => [u.id, u]));
      const afterById = new Map(frame.units.map((u) => [u.id, u]));
      const source = beforeById.get(action.sourceUnitID);

      // Dégâts et impacts
      for (const prev of before) {
        const next = afterById.get(prev.id);
        if (!next) {
          out.push({ key: key(), kind: "death", x: prev.x, y: prev.y, unitID: prev.id });
          continue;
        }
        const lost = prev.health - next.health;
        if (lost > 0) {
          out.push({ key: key(), kind: "damage", x: next.x, y: next.y, value: lost, unitID: prev.id });
          out.push({ key: key(), kind: "hit", x: next.x, y: next.y, unitID: prev.id });
        }
      }

      // Geste de l'attaquant : trait de tir à distance, ruée au contact
      if (action.type === "attack" && source) {
        const target = beforeById.get(action.targetUnitID);
        if (target) {
          const distance = Math.max(Math.abs(target.x - source.x), Math.abs(target.y - source.y));
          out.push({
            key: key(),
            kind: distance > 1 ? "tracer" : "lunge",
            x: target.x,
            y: target.y,
            fromX: source.x,
            fromY: source.y,
            unitID: source.id,
          });
        }
      }

      // Signature de capacité, posée sur la cible désignée
      if (action.type === "ability") {
        const target = beforeById.get(action.targetUnitID);
        const x = target ? target.x : action.targetX >= 0 ? action.targetX : source?.x ?? 0;
        const y = target ? target.y : action.targetY >= 0 ? action.targetY : source?.y ?? 0;
        out.push({
          key: key(),
          kind: "ability",
          x,
          y,
          fromX: source?.x,
          fromY: source?.y,
          abilityID: action.abilityID,
          unitID: action.sourceUnitID,
        });
      }

      return out;
    },
    []
  );

  useEffect(() => {
    if (!state) {
      setDisplay([]);
      setLog([]);
      return;
    }

    const myRun = ++runId.current;
    const steps = (state.recentActions ?? []).filter((a) => a.frame);

    // Première main, rejeu désactivé, ou rien à rejouer : on pose l'état tel quel.
    if (steps.length === 0 || prefersReducedMotion()) {
      setDisplay(state.units);
      setActionsLeft(state.actionsLeft);
      setIsReplaying(false);
      setCurrentAction(null);
      if (steps.length > 0) {
        setLog((prev) => [
          ...steps.map((s) => toLogEntry(state.units, s, state.turn)).reverse(),
          ...prev,
        ]);
      }
      return;
    }

    let cancelled = false;

    (async () => {
      setIsReplaying(true);

      // On repart de l'affichage courant, en réinjectant les données statiques
      // (nom, illustration, caractéristiques) que les images ne transportent pas.
      let current: BattleUnit[] = display.length > 0
        ? display
        : state.units;

      const statics = new Map(state.units.map((u) => [u.id, u]));
      current = current.map((u) => ({ ...(statics.get(u.id) ?? u), ...u }));

      for (const step of steps) {
        if (cancelled || runId.current !== myRun) return;

        setCurrentAction(step);
        pushEffects(diffEffects(current, step.frame!, step), DURATIONS[step.type] ?? 400);

        // L'entrée d'historique est composée AVANT d'appliquer l'image : une
        // unité tuée par cette action y perdrait son nom sinon.
        const entry = toLogEntry(current, step, state.turn);

        current = applyFrame(current, step.frame!);
        setDisplay(current);
        setActionsLeft(step.frame!.actionsLeft);
        setLog((prev) => [entry, ...prev]);

        await sleep((DURATIONS[step.type] ?? 400) + BEAT);
      }

      if (cancelled || runId.current !== myRun) return;

      // On se recale sur l'état faisant autorité : le rejeu est une mise en
      // scène, jamais la source de vérité.
      setDisplay(state.units);
      setActionsLeft(state.actionsLeft);
      setCurrentAction(null);
      setIsReplaying(false);
    })();

    return () => {
      cancelled = true;
    };
    // `display` est volontairement hors des dépendances : il est lu comme point
    // de départ, et l'inclure relancerait la séquence à chaque image.
  }, [state]);

  return { display, actionsLeft, effects, isReplaying, currentAction, log, setLog };
};
