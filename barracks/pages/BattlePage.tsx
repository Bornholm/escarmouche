import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad, Unit } from "../types";
import { ActionDescription, BattleState, DeploymentState, Difficulty } from "../battle";
import { BattleBoard, cellName } from "../components/BattleBoard";
import { ReplayLogEntry, useBattleReplay } from "../hooks/useBattleReplay";
import { useAbilities } from "../hooks/useAbilities";
import { DefaultSquads, DefaultUnits } from "../util/defaults";
import { StatIcon } from "../components/Icons";
import { UnitCard } from "../components/UnitCard";

interface BattlePageProps {
  squads: Squad[];
  units: Unit[];
}

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

/** Temps laissé au joueur pour lire le plateau de départ avant le coup d'envoi. */
const OPENING_PAUSE = 900;

export const BattlePage: React.FC<BattlePageProps> = ({ squads, units }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<"select" | "setup" | "deploy" | "battle">("select");
  const [obstacle, setObstacle] = useState<{ x: number; y: number } | null>(null);
  // Escouade adverse : une escouade thématique du catalogue, différente de
  // celle du joueur — l'IA a ainsi un nom, un lore et des illustrations.
  const [aiSquad, setAiSquad] = useState<Squad | null>(null);
  const [deployment, setDeployment] = useState<DeploymentState | null>(null);
  // Le joueur choisit l'ordre de déploiement : `deployIndex` est l'unité
  // qu'il s'apprête à poser, `previewIndex` celle dont il lit la carte.
  const [deployIndex, setDeployIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // Index de l'unité ADVERSE survolée pendant le déploiement : sa carte prend
  // alors la place de lecture, pour jauger ce qui vient d'être posé en face.
  const [aiPreviewIndex, setAiPreviewIndex] = useState<number | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedUnitID, setSelectedUnitID] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<ActionDescription | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [selectedSquadID, setSelectedSquadID] = useState<string | null>(null);
  // La promesse de selectAction ne revient qu'après le tour complet de l'IA :
  // cet état permet d'afficher immédiatement que la machine réfléchit.
  const [isResolving, setIsResolving] = useState(false);
  // Deux attentes distinctes : envoyer SON action (bref) et attendre la
  // réflexion de l'IA (long). Les confondre faisait annoncer « Tour de l'IA »
  // dès le clic du joueur, alors que c'était encore son action qui partait.
  const [isThinking, setIsThinking] = useState(false);

  // Le plateau affiché n'est pas l'état de jeu : c'est le rejeu des actions
  // qui viennent d'être jouées, déroulé image par image.
  const { display, actionsLeft, effects, isReplaying, log, settled } = useBattleReplay(battleState);
  // Garde-fou : un même état ne doit déclencher qu'une seule reprise, sinon
  // un second appel resterait bloqué sur le canal du moteur et désynchro-
  // niserait la partie.
  const resumedFor = useRef<BattleState | null>(null);
  const abilityCatalog = useAbilities();

  /** Nom lisible d'une capacité ; à défaut son identifiant, jamais rien. */
  const abilityName = (id: string | undefined): string =>
    (id && abilityCatalog?.find((a) => a.id === id)?.label) || id || "";

  /** Description de la capacité, pour l'infobulle du bouton d'action. */
  const abilityHint = (id: string | undefined): string | undefined =>
    (id && abilityCatalog?.find((a) => a.id === id)?.description) || undefined;

  // L'historique est composé ici plutôt que dans le moteur : il doit être
  // traduit, parler en repères de case ("A2") et nommer les capacités par leur
  // libellé, pas par leur identifiant de fichier.
  const describeLogEntry = (entry: ReplayLogEntry): string => {
    // Les unités de l'IA sont générées par le moteur et n'ont pas de nom :
    // on les désigne de façon traduisible plutôt que par un identifiant nu.
    const named = (name: string, id: number) =>
      name !== "" ? name : t("battle.enemyUnit", { id });

    switch (entry.type) {
      case "move":
        return t("battle.logMove", {
          unit: named(entry.sourceName, entry.sourceID),
          cell: cellName(entry.targetX, entry.targetY),
        });
      case "attack":
        return t("battle.logAttack", {
          unit: named(entry.sourceName, entry.sourceID),
          target: named(entry.targetName, entry.targetID),
        });
      case "ability": {
        return t("battle.logAbility", {
          unit: named(entry.sourceName, entry.sourceID),
          ability: abilityName(entry.abilityID),
        });
      }
      default:
        return named(entry.sourceName, entry.sourceID);
    }
  };

  useEffect(() => {
    return () => {
      Barracks.endGame();
    };
  }, []);

  // Une fois l'action du joueur animée, on relance le moteur : c'est
  // seulement là que l'IA se met à réfléchir. L'action du joueur a donc été
  // vue AVANT, au lieu d'être rendue en même temps que celles de l'IA.
  useEffect(() => {
    if (!battleState?.awaitingResume) return;
    // On n'enchaîne qu'une fois l'animation de l'action réellement terminée.
    if (settled !== battleState) return;
    if (resumedFor.current === battleState) return;
    resumedFor.current = battleState;

    let cancelled = false;
    (async () => {
      setIsThinking(true);
      try {
        const next = (await Barracks.resumeGame()) as unknown as BattleState;
        if (!cancelled) setBattleState(next);
      } catch (error) {
        console.error("resumeGame failed", error);
      } finally {
        if (!cancelled) setIsThinking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [battleState, settled]);

  // La partie n'est lancée qu'une fois le plateau de départ peint : le joueur
  // voit son déploiement et sait qui ouvre avant que le premier coup ne parte.
  // `requestAnimationFrame` garantit qu'au moins une image a été rendue.
  useEffect(() => {
    if (step !== "battle" || !battleState || battleState.started) return;

    let cancelled = false;
    const id = requestAnimationFrame(() => {
      setTimeout(async () => {
        if (cancelled) return;
        setIsResolving(true);
        try {
          const state = (await Barracks.beginBattle()) as unknown as BattleState;
          if (!cancelled) setBattleState(state);
        } catch (error) {
          console.error("beginBattle failed", error);
        } finally {
          if (!cancelled) setIsResolving(false);
        }
      }, OPENING_PAUSE);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [step, battleState]);

  // On ne rend la main qu'une fois la mise en scène terminée : cliquer pendant
  // le rejeu reviendrait à jouer sur un plateau qui n'est pas encore le bon.
  const isHumanTurn = useMemo(() => {
    if (!battleState) return false;
    return (
      battleState.started !== false &&
      !battleState.awaitingResume &&
      battleState.currentPlayerID === battleState.humanPlayerID &&
      !battleState.isOver &&
      !isReplaying &&
      !isResolving &&
      !isThinking
    );
  }, [battleState, isReplaying, isResolving, isThinking]);

  const getSelectedUnits = (): Unit[] => {
    if (selectedSquadID === "__default__") return DefaultUnits.slice(0, 4);
    const squad = squads.find((s) => s.id === selectedSquadID);
    if (!squad) return [];
    return squad.units
      .map((u) => units.find((full) => full.id === u.id))
      .filter((u): u is Unit => !!u);
  };

  /** Tire une escouade adverse parmi les escouades thématiques, en évitant
      celle que le joueur a choisie. */
  const pickAiSquad = (): Squad => {
    const candidates = DefaultSquads.filter((s) => s.id !== selectedSquadID);
    const pool = candidates.length > 0 ? candidates : DefaultSquads;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const resolveSquadUnits = (squad: Squad): Unit[] =>
    squad.units
      .map((u) => units.find((full) => full.id === u.id) ?? u)
      .filter((u): u is Unit => !!u);

  const toInputs = (list: Unit[]) =>
    list.map((u) => ({
      health: u.health,
      range: u.range,
      move: u.move,
      power: u.power,
      abilities: u.abilities,
      name: u.name,
      imageUrl: u.imageUrl ?? "",
    }));

  /** Ouvre la phase de déploiement alterné une fois l'obstacle posé. */
  const handleStartDeployment = async (placedObstacle: { x: number; y: number }) => {
    const mine = getSelectedUnits();
    const opponent = pickAiSquad();
    setAiSquad(opponent);

    try {
      const state = (await Barracks.startDeployment(
        toInputs(mine),
        toInputs(resolveSquadUnits(opponent)),
        [placedObstacle]
      )) as unknown as DeploymentState;
      setDeployment(state);
      setDeployIndex(0);
      setStep("deploy");
    } catch (error) {
      console.error("startDeployment failed", error);
    }
  };

  const handleDeployAt = async (x: number, y: number) => {
    if (deployIndex === null) return;
    try {
      const state = (await Barracks.deployUnit(deployIndex, x, y)) as unknown as DeploymentState;
      setDeployment(state);
      // On enchaîne sur la première unité encore à déployer.
      const next = state.playerPositions.findIndex((p) => p === null);
      setDeployIndex(next === -1 ? null : next);
    } catch (error) {
      console.error("deployUnit failed", error);
    }
  };

  const handleStartBattle = async (squadUnits: Unit[], placedObstacle: { x: number; y: number }) => {
    const unitInputs = squadUnits.map((u) => ({
      health: u.health,
      range: u.range,
      move: u.move,
      power: u.power,
      abilities: u.abilities,
      name: u.name,
      imageUrl: u.imageUrl ?? "",
    }));

    try {
      // Un pointeur grossier signale un appareil tactile, donc un CPU mobile :
      // l'IA y reçoit un budget de réflexion réduit pour rester réactive.
      const lowPower =
        typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

      const state = (await Barracks.startGame(
        unitInputs,
        difficulty,
        placedObstacle,
        lowPower,
        aiSquad ? toInputs(resolveSquadUnits(aiSquad)) : undefined
      )) as unknown as BattleState;
      setBattleState(state);
      setStep("battle");
      setSelectedUnitID(null);
    } catch (error) {
      console.error("startGame failed", error);
    }
  };

  const handleActionClick = async (action: ActionDescription) => {
    if (!battleState || isReplaying || isResolving || isThinking) return;
    setSelectedUnitID(null);
    setHoveredAction(null);
    setIsResolving(true);

    try {
      const newState = (await Barracks.selectAction(action.index)) as unknown as BattleState;
      setBattleState(newState);
    } catch (error) {
      console.error("selectAction failed", error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleMoveClick = (x: number, y: number) => {
    if (!battleState || selectedUnitID === null) return;
    const action = battleState.validActions.find(
      (a) => a.type === "move" && a.sourceUnitID === selectedUnitID && a.targetX === x && a.targetY === y
    );
    if (action) handleActionClick(action);
  };

  const handleUnitClick = (unitID: number) => {
    if (unitID < 0) {
      setSelectedUnitID(null);
      return;
    }
    setSelectedUnitID((prev) => (prev === unitID ? null : unitID));
  };

  const handleRematch = async () => {
    const squadUnits = getSelectedUnits();
    if (squadUnits.length === 0 || !obstacle) {
      setStep("select");
      return;
    }
    setBattleState(null);
    setStep("battle");
    await handleStartBattle(squadUnits, obstacle);
  };

  const quitBattle = () => {
    Barracks.endGame();
    setStep("select");
    setBattleState(null);
    setSelectedUnitID(null);
  };

  const selectedUnit = useMemo(() => {
    if (selectedUnitID === null) return null;
    return display.find((u) => u.id === selectedUnitID) ?? null;
  }, [display, selectedUnitID]);

  const unitActions = useMemo(() => {
    if (!battleState || selectedUnitID === null || isReplaying) return [];
    return battleState.validActions.filter((a) => a.sourceUnitID === selectedUnitID);
  }, [battleState, selectedUnitID, isReplaying]);

  /* ---------------------------------------------------------------------------
     Écran de sélection
     ------------------------------------------------------------------------ */
  if (step === "select") {
    const chosen = getSelectedUnits();

    return (
      <>
        <div className="page__head">
          <h1 className="page__title">{t("battle.title")}</h1>
          <div className="spacer" />
        </div>

        <div className="panel__section">
          <div className="section-label">{t("battle.selectSquad")}</div>

          <div className="squad-grid">
            {squads.map((squad) => (
              <button
                key={squad.id}
                className={`squad-card card-select ${selectedSquadID === squad.id ? "squad-card--selected" : ""}`}
                onClick={() => setSelectedSquadID(squad.id)}
              >
                <div className="squad-card__name">{squad.name}</div>
                <div className="section-label">
                  {t("squadEditor.unitCount", { n: squad.units.length, max: 6 })}
                </div>
              </button>
            ))}

            <button
              className={`squad-card card-select ${selectedSquadID === "__default__" ? "squad-card--selected" : ""}`}
              onClick={() => setSelectedSquadID("__default__")}
            >
              <div className="squad-card__name">{t("battle.useDefault")}</div>
              <div className="section-label">{t("squadEditor.unitCount", { n: 4, max: 6 })}</div>
            </button>
          </div>
        </div>

        <div className="panel__section">
          <div className="section-label">{t("battle.difficulty")}</div>
          <div className="segmented" style={{ maxWidth: 320 }}>
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                className={`segmented__item ${difficulty === level ? "segmented__item--active" : ""}`}
                onClick={() => setDifficulty(level)}
              >
                {t(`battle.difficulties.${level}` as never)}
              </button>
            ))}
          </div>

          <div className="row row--2">
            <button
              className="btn btn--primary"
              disabled={chosen.length === 0}
              onClick={() => setStep("setup")}
            >
              {t("battle.toSetup")}
            </button>
            <button className="btn" onClick={() => navigate("/squads")}>
              {t("battle.back")}
            </button>
          </div>

          {squads.length === 0 && <div className="notice">{t("battle.noSquads")}</div>}
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------------------
     Mise en place : le joueur pose son obstacle (1 case, hors zone centrale
     et zones de déploiement), puis la partie démarre — l'IA pose le sien.
     ------------------------------------------------------------------------ */
  if (step === "setup") {
    const valid = new Set(
      (Barracks.ValidObstaclePositions ?? []).map((p) => `${p.x},${p.y}`)
    );
    const rows = Array.from({ length: 8 }, (_, i) => 7 - i);

    return (
      <>
        <div className="page__head">
          <button className="btn btn--sm" onClick={() => setStep("select")}>
            {t("battle.back")}
          </button>
          <h1 className="page__title">{t("battle.setupTitle")}</h1>
          <div className="spacer" />
        </div>

        <div className="panel__section">
          <p className="empty__text" style={{ maxWidth: 520 }}>
            {t("battle.setupHint")}
          </p>

          <div className="board-wrap">
            <div className="board">
              {rows.flatMap((y) =>
                Array.from({ length: 8 }, (_, x) => {
                  const key = `${x},${y}`;
                  const isObjective = x >= 3 && x <= 4 && y >= 3 && y <= 4;
                  const placeable = valid.has(key);
                  const chosen = obstacle?.x === x && obstacle?.y === y;
                  return (
                    <div
                      key={key}
                      role={placeable ? "button" : undefined}
                      tabIndex={placeable ? 0 : undefined}
                      className={[
                        "cell",
                        (x + y) % 2 === 0 ? "cell--dark" : "cell--light",
                        isObjective ? "cell--objective" : "",
                        placeable ? "cell--placeable" : "",
                        chosen ? "cell--selected" : "",
                      ].join(" ")}
                      onClick={() => placeable && setObstacle({ x, y })}
                      onKeyDown={(event) => {
                        if (placeable && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          setObstacle({ x, y });
                        }
                      }}
                    >
                      {chosen && (
                        <svg className="mark mark--obstacle" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 20h16M6 20l2-9h8l2 9M9 11l1-5h4l1 5" />
                        </svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="row row--2">
            <button
              className="btn btn--primary"
              disabled={!obstacle}
              onClick={() => obstacle && handleStartDeployment(obstacle)}
            >
              {t("battle.toDeployment")}
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------------------
     Déploiement alterné : le joueur place une unité, l'IA répond, et ainsi de
     suite — comme au vrai jeu, chaque camp voit ce que l'autre a posé.
     ------------------------------------------------------------------------ */
  if (step === "deploy" && deployment) {
    const mine = getSelectedUnits();
    const rows = Array.from({ length: 8 }, (_, i) => 7 - i);

    // Une case porte soit une unité du joueur (on sait laquelle), soit une
    // unité adverse déjà posée.
    const playerAt = new Map<string, number>();
    deployment.playerPositions.forEach((p, index) => {
      if (p) playerAt.set(`${p.x},${p.y}`, index);
    });
    // Les règles font du déploiement un acte tactique VISIBLE : le joueur doit
    // voir quelle unité l'adversaire vient de poser, pas un pion anonyme.
    // aiPositions est ordonné comme l'escouade transmise au moteur.
    const foes = aiSquad ? resolveSquadUnits(aiSquad) : [];
    const aiAtIndex = new Map<string, number>();
    deployment.aiPositions.forEach((p, index) => {
      aiAtIndex.set(`${p.x},${p.y}`, index);
    });
    const obstacleSet = new Set(deployment.obstacles.map((o) => `${o.x},${o.y}`));

    // La carte lue : l'unité adverse survolée d'abord (c'est elle qu'on cherche
    // à jauger), sinon la sienne survolée, sinon celle qu'on s'apprête à poser.
    const readIndex = previewIndex ?? deployIndex;
    const readUnit =
      aiPreviewIndex !== null
        ? foes[aiPreviewIndex] ?? null
        : readIndex !== null
        ? mine[readIndex]
        : null;

    return (
      <>
        <div className="page__head">
          <button className="btn btn--sm" onClick={() => setStep("setup")}>
            {t("battle.back")}
          </button>
          <h1 className="page__title">{t("battle.deployTitle")}</h1>
          <div className="spacer" />
          <span className="section-label">
            {t("battle.deployProgress", { n: deployment.placed, max: deployment.playerTotal })}
          </span>
        </div>

        <div className="deploy">
          {/* Colonne gauche : les unités à poser, dans l'ordre qu'on veut */}
          <aside className="deploy__roster">
            {aiSquad && (
              <div className="notice">{t("battle.opponentIs", { squad: aiSquad.name })}</div>
            )}

            <div className="hint">{t("battle.obstaclesPlaced")}</div>

            <div className="section-label">{t("battle.deployRoster")}</div>

            <div className="stack stack--2">
              {mine.map((unit, index) => {
                const done = deployment.playerPositions[index] !== null;
                return (
                  <button
                    key={`${unit.id}-${index}`}
                    className={`deploy__unit ${deployIndex === index ? "deploy__unit--active" : ""} ${
                      done ? "deploy__unit--done" : ""
                    }`}
                    disabled={done}
                    onClick={() => setDeployIndex(index)}
                    onMouseEnter={() => setPreviewIndex(index)}
                    onMouseLeave={() => setPreviewIndex(null)}
                    onFocus={() => setPreviewIndex(index)}
                    onBlur={() => setPreviewIndex(null)}
                  >
                    <span className="deploy__unit-art">
                      {unit.imageUrl && <img src={unit.imageUrl} alt="" />}
                    </span>
                    <span className="grow-min">
                      <span className="deploy__unit-name">{unit.name}</span>
                      <span className="deploy__unit-stats num">
                        {unit.health} · {unit.range} · {unit.power} · {unit.move}
                      </span>
                    </span>
                    {done && <span className="deploy__unit-check">✓</span>}
                  </button>
                );
              })}
            </div>

            <p className="hint">
              {deployment.done
                ? t("battle.deployReady")
                : t("battle.deployHintFree")}
            </p>

            <button
              className="btn btn--primary btn--block"
              disabled={!deployment.done}
              onClick={() => obstacle && handleStartBattle(mine, obstacle)}
            >
              {t("battle.startBattle")}
            </button>
          </aside>

          {/* Centre : le plateau */}
          <div className="board-wrap">
            <div className="board">
              {rows.flatMap((y) =>
                Array.from({ length: 8 }, (_, x) => {
                  const key = `${x},${y}`;
                  const mineIndex = playerAt.get(key);
                  const aiIndex = aiAtIndex.get(key);
                  const isAi = aiIndex !== undefined;
                  const isObjective = x >= 3 && x <= 4 && y >= 3 && y <= 4;
                  const isObstacle = obstacleSet.has(key);
                  const isMyObstacle = obstacle?.x === x && obstacle?.y === y;
                  const inMyZone = y <= 1;
                  const placeable =
                    deployIndex !== null &&
                    inMyZone &&
                    mineIndex === undefined &&
                    !isAi &&
                    !isObstacle;

                  return (
                    <div
                      key={key}
                      role={placeable ? "button" : undefined}
                      tabIndex={placeable ? 0 : undefined}
                      aria-label={cellName(x, y)}
                      className={[
                        "cell",
                        (x + y) % 2 === 0 ? "cell--dark" : "cell--light",
                        isObjective ? "cell--objective" : "",
                        isObstacle ? "cell--obstacle" : "",
                        isObstacle && !isMyObstacle ? "cell--obstacle-ai" : "",
                        placeable ? "cell--placeable" : "",
                      ].join(" ")}
                      title={
                        isObstacle
                          ? isMyObstacle
                            ? t("battle.yourObstacle")
                            : t("battle.aiObstacle")
                          : undefined
                      }
                      onClick={() => placeable && handleDeployAt(x, y)}
                      onKeyDown={(event) => {
                        if (placeable && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          handleDeployAt(x, y);
                        }
                      }}
                    >
                      {isObstacle && (
                        <svg className="mark mark--obstacle" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 20h16M6 20l2-9h8l2 9M9 11l1-5h4l1 5" />
                        </svg>
                      )}

                      {mineIndex !== undefined && (
                        <div
                          className="token token--player"
                          onMouseEnter={() => setPreviewIndex(mineIndex)}
                          onMouseLeave={() => setPreviewIndex(null)}
                        >
                          <div className="token__owner" />
                          <div className="token__art">
                            {mine[mineIndex]?.imageUrl ? (
                              <img src={mine[mineIndex].imageUrl} alt="" />
                            ) : (
                              <span aria-hidden="true">◆</span>
                            )}
                          </div>
                        </div>
                      )}

                      {aiIndex !== undefined && (
                        <div
                          className="token token--ai"
                          title={foes[aiIndex]?.name}
                          onMouseEnter={() => setAiPreviewIndex(aiIndex)}
                          onMouseLeave={() => setAiPreviewIndex(null)}
                        >
                          <div className="token__owner" />
                          <div className="token__art">
                            {foes[aiIndex]?.imageUrl ? (
                              <img src={foes[aiIndex].imageUrl} alt="" />
                            ) : (
                              <span aria-hidden="true">◆</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Droite : la carte de l'unité lue — la lecture stratégique */}
          <aside className="deploy__card">
            <div className="section-label">{t("battle.deployCard")}</div>
            {readUnit ? (
              <UnitCard unit={readUnit} variant="preview" />
            ) : (
              <p className="hint">{t("battle.deployCardEmpty")}</p>
            )}
          </aside>
        </div>
      </>
    );
  }

  if (!battleState) {
    return (
      <div className="loading">
        <div className="loading__bar"><div className="loading__fill" /></div>
        <div className="loading__label">{t("battle.loading")}</div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------------
     Fin de partie — on laisse le rejeu se terminer avant d'annoncer le résultat
     ------------------------------------------------------------------------ */
  if (battleState.isOver && !isReplaying) {
    const won = battleState.winner === battleState.humanPlayerID;
    const draw = battleState.winner < 0;

    return (
      <div className="outcome">
        <div
          className={`outcome__title ${won ? "outcome__title--win" : draw ? "" : "outcome__title--lose"}`}
        >
          {draw ? t("battle.draw") : won ? t("battle.victory") : t("battle.defeat")}
        </div>
        <p className="empty__text">
          {draw ? t("battle.drawMessage") : won ? t("battle.victoryMessage") : t("battle.defeatMessage")}
        </p>
        <div className="row row--2">
          <button className="btn btn--primary" onClick={handleRematch}>
            {t("battle.rematch")}
          </button>
          <button className="btn" onClick={quitBattle}>
            {t("battle.back")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------------
     Partie en cours
     ------------------------------------------------------------------------ */
  const playerUnits = display.filter((u) => u.ownerID === battleState.humanPlayerID);
  const aiUnits = display.filter((u) => u.ownerID !== battleState.humanPlayerID);

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">{t("battle.title")}</h1>
        <span className="section-label">{t(`battle.difficulties.${difficulty}` as never)}</span>
        <div className="spacer" />
        <span className="section-label">
          {t("battle.yourUnits")} {playerUnits.length} · {t("battle.aiUnits")} {aiUnits.length}
        </span>
        <button className="btn btn--sm" onClick={quitBattle}>
          {t("battle.forfeit")}
        </button>
      </div>

      <div className="battle">
        <div className="battle__board">
          <BattleBoard
            units={display}
            obstacles={battleState.obstacles ?? []}
            validActions={battleState.validActions}
            selectedUnitID={selectedUnitID}
            humanPlayerID={battleState.humanPlayerID}
            isHumanTurn={isHumanTurn}
            effects={effects}
            isReplaying={isReplaying}
            hoveredAction={hoveredAction}
            onUnitClick={handleUnitClick}
            onMoveClick={handleMoveClick}
            onActionClick={handleActionClick}
          />
        </div>

        <aside className="battle__panel">
          <div className="turn">
            <div className="row">
              {/* La clé force le rejeu du bandeau à chaque bascule : le
                  changement de main ne doit pas passer inaperçu. */}
              <div
                className="turn__who turn__banner"
                key={
                  battleState.started === false
                    ? "start"
                    : isThinking
                    ? "think"
                    : isResolving
                    ? "resolve"
                    : isReplaying
                    ? "replay"
                    : isHumanTurn
                    ? "you"
                    : "ai"
                }
              >
                <span className={`turn__dot ${isHumanTurn ? "" : "turn__dot--ai"}`} />
                {battleState.started === false
                  ? t("battle.starting")
                  : isThinking
                  ? t("battle.aiTurn")
                  : isResolving
                  ? t("battle.replaying")
                  : isReplaying
                  ? t("battle.replaying")
                  : isHumanTurn
                  ? t("battle.yourTurn")
                  : t("battle.aiTurn")}
              </div>
              <div className="spacer" />
              <span className="section-label">{t("battle.turn", { turn: battleState.turn })}</span>
            </div>

            <div className="control-score">
              <span className="field__label">{t("battle.controlScore")}</span>
              <div className="spacer" />
              <div className="control-score__pips" title={t("battle.yourUnits")}>
                {Array.from({ length: Barracks.ControlPointsToWin ?? 3 }, (_, i) => (
                  <span
                    key={i}
                    className={`control-score__pip ${
                      i < (battleState.controlPoints?.player ?? 0) ? "control-score__pip--filled" : ""
                    }`}
                  />
                ))}
              </div>
              <span className="section-label">{t("battle.scoreSeparator")}</span>
              <div className="control-score__pips" title={t("battle.aiUnits")}>
                {Array.from({ length: Barracks.ControlPointsToWin ?? 3 }, (_, i) => (
                  <span
                    key={i}
                    className={`control-score__pip control-score__pip--ai ${
                      i < (battleState.controlPoints?.ai ?? 0) ? "control-score__pip--filled" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="stack stack--2">
              <span className="field__label">{t("battle.actionsLeftLabel")}</span>
              <div className="actions-left">
                {[0, 1].map((index) => {
                  // Avant le coup d'envoi, le moteur n'a pas encore ouvert de
                  // tour : afficher « utilisée » donnerait l'impression que
                  // des actions ont déjà été jouées.
                  const left = battleState.started === false ? 2 : actionsLeft;
                  return (
                    <div
                      key={index}
                      className={`actions-left__slot ${index >= left ? "actions-left__slot--used" : ""}`}
                    >
                      {index >= left ? t("battle.actionUsed") : "●"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedUnit && (
            <div className="panel__section">
              <div className="section-label">{t("battle.selectedUnit")}</div>

              <div className="row row--3">
                <div className="selected-unit__art">
                  {selectedUnit.imageURL && <img src={selectedUnit.imageURL} alt="" />}
                </div>
                <div className="stack stack--2 grow-min">
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedUnit.name}</div>
                  <div className="row row--2">
                    <div className="hpbar">
                      <div
                        className="hpbar__fill"
                        style={{ width: `${(selectedUnit.health / selectedUnit.maxHealth) * 100}%` }}
                      />
                    </div>
                    <span className="num meta">
                      {selectedUnit.health}/{selectedUnit.maxHealth}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row row--2">
                {(["range", "power", "move"] as const).map((stat) => (
                  <div key={stat} className="unit-tile__stat stat-chip">
                    <StatIcon stat={stat} size={11} strokeWidth={2} color="var(--text-faint)" />
                    <span>{selectedUnit[stat]}</span>
                  </div>
                ))}
              </div>

              {/* Les capacités de l'unité sont annoncées ici, qu'elles soient
                  activables ou non : sans cela, une capacité dont les
                  conditions ne sont pas réunies est indiscernable d'une unité
                  qui n'en a aucune, et le joueur conclut que le jeu ne les
                  propose pas. Celles jouables à l'instant sont mises en avant. */}
              {selectedUnit.abilities?.length > 0 && (
                <div className="row row--2">
                  {selectedUnit.abilities.map((id) => {
                    const usable = unitActions.some(
                      (a) => a.type === "ability" && a.abilityID === id
                    );
                    return (
                      <div
                        key={id}
                        className={`stat-chip ${usable ? "" : "stat-chip--muted"}`}
                        title={abilityHint(id)}
                      >
                        <svg
                          className="action-btn__glyph"
                          viewBox="0 0 24 24"
                          style={{
                            stroke: usable ? "var(--act-ability-mark)" : "var(--text-faint)",
                            strokeWidth: 2.4,
                            width: 11,
                            height: 11,
                          }}
                        >
                          <path d="M12 4l8 8-8 8-8-8z" />
                        </svg>
                        <span>{abilityName(id)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="panel__section">
            <div className="section-label">{t("battle.validActions", { n: unitActions.length })}</div>

            {isReplaying || isResolving || isThinking ? (
              <div className="hint">
                {isThinking ? t("battle.aiThinkingHint") : t("battle.replayingHint")}
              </div>
            ) : selectedUnitID === null ? (
              <div className="hint">{t("battle.selectUnitHint")}</div>
            ) : unitActions.length === 0 ? (
              <div className="hint">{t("battle.noActions")}</div>
            ) : (
              <div className="stack stack--2">
                {unitActions.map((action) => (
                  <button
                    key={action.index}
                    className={`action-btn action-btn--${action.type}`}
                    onClick={() => handleActionClick(action)}
                    onMouseEnter={() => setHoveredAction(action)}
                    onMouseLeave={() => setHoveredAction(null)}
                    onFocus={() => setHoveredAction(action)}
                    onBlur={() => setHoveredAction(null)}
                    disabled={!isHumanTurn}
                    title={action.type === "ability" ? abilityHint(action.abilityID) : undefined}
                  >
                    {action.type === "move" && (
                      <span className="mark mark--move" style={{ position: "static", transform: "none" }} />
                    )}
                    {action.type === "attack" && (
                      <svg
                        className="action-btn__glyph"
                        viewBox="0 0 24 24"
                        style={{ stroke: "var(--act-attack-mark)", strokeWidth: 2.6 }}
                      >
                        <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
                      </svg>
                    )}
                    {action.type === "ability" && (
                      <svg
                        className="action-btn__glyph"
                        viewBox="0 0 24 24"
                        style={{ stroke: "var(--act-ability-mark)", strokeWidth: 2.4 }}
                      >
                        <path d="M12 4l8 8-8 8-8-8z" />
                      </svg>
                    )}

                    <span className="grow">
                      {action.type === "move"
                        ? t("battle.moveTo", { cell: cellName(action.targetX, action.targetY) })
                        : action.type === "ability"
                        ? abilityName(action.abilityID)
                        : action.label}
                    </span>

                    {/* Le coût du coup, annoncé avant d'être porté */}
                    {action.type === "attack" && selectedUnit && (
                      <span className="num action-btn__damage">−{selectedUnit.power}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel__section">
            <div className="section-label">{t("battle.aiLog")}</div>
            <div className="log">
              {log.length === 0 ? (
                <span className="hint">—</span>
              ) : (
                log.slice(0, 40).map((entry, index) => (
                  <div
                    key={`${entry.turn}-${index}-${entry.type}-${entry.sourceName}`}
                    className={`log__row ${index === 0 ? "log__row--fresh" : ""}`}
                  >
                    <span className="log__turn">T{entry.turn}</span>
                    <span
                      className={`grow ${entry.playerID === battleState.humanPlayerID ? "log__you" : ""}`}
                    >
                      {describeLogEntry(entry)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
