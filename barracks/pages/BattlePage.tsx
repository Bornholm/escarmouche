import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad, Unit } from "../types";
import { ActionDescription, BattleState, Difficulty } from "../battle";
import { BattleBoard, cellName } from "../components/BattleBoard";
import { ReplayLogEntry, useBattleReplay } from "../hooks/useBattleReplay";
import { useAbilities } from "../hooks/useAbilities";
import { DefaultUnits } from "../util/defaults";
import { StatIcon } from "../components/Icons";

interface BattlePageProps {
  squads: Squad[];
  units: Unit[];
}

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export const BattlePage: React.FC<BattlePageProps> = ({ squads, units }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<"select" | "setup" | "battle">("select");
  const [obstacle, setObstacle] = useState<{ x: number; y: number } | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedUnitID, setSelectedUnitID] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<ActionDescription | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [selectedSquadID, setSelectedSquadID] = useState<string | null>(null);

  // Le plateau affiché n'est pas l'état de jeu : c'est le rejeu des actions
  // qui viennent d'être jouées, déroulé image par image.
  const { display, actionsLeft, effects, isReplaying, log } = useBattleReplay(battleState);
  const abilityCatalog = useAbilities();

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
        const ability = abilityCatalog?.find((a) => a.id === entry.abilityID);
        return t("battle.logAbility", {
          unit: named(entry.sourceName, entry.sourceID),
          ability: ability?.label ?? entry.abilityID,
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

  // On ne rend la main qu'une fois la mise en scène terminée : cliquer pendant
  // le rejeu reviendrait à jouer sur un plateau qui n'est pas encore le bon.
  const isHumanTurn = useMemo(() => {
    if (!battleState) return false;
    return (
      battleState.currentPlayerID === battleState.humanPlayerID &&
      !battleState.isOver &&
      !isReplaying
    );
  }, [battleState, isReplaying]);

  const getSelectedUnits = (): Unit[] => {
    if (selectedSquadID === "__default__") return DefaultUnits.slice(0, 4);
    const squad = squads.find((s) => s.id === selectedSquadID);
    if (!squad) return [];
    return squad.units
      .map((u) => units.find((full) => full.id === u.id))
      .filter((u): u is Unit => !!u);
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
      const state = (await Barracks.startGame(
        unitInputs,
        difficulty,
        placedObstacle
      )) as unknown as BattleState;
      setBattleState(state);
      setStep("battle");
      setSelectedUnitID(null);
    } catch (error) {
      console.error("startGame failed", error);
    }
  };

  const handleActionClick = async (action: ActionDescription) => {
    if (!battleState || isReplaying) return;
    setSelectedUnitID(null);
    setHoveredAction(null);

    try {
      const newState = (await Barracks.selectAction(action.index)) as unknown as BattleState;
      setBattleState(newState);
    } catch (error) {
      console.error("selectAction failed", error);
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
              onClick={() => obstacle && handleStartBattle(getSelectedUnits(), obstacle)}
            >
              {t("battle.startBattle")}
            </button>
          </div>
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
                key={isReplaying ? "replay" : isHumanTurn ? "you" : "ai"}
              >
                <span className={`turn__dot ${isHumanTurn ? "" : "turn__dot--ai"}`} />
                {isReplaying
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
              <span className="section-label">vs</span>
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
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className={`actions-left__slot ${index >= actionsLeft ? "actions-left__slot--used" : ""}`}
                  >
                    {index >= actionsLeft ? t("battle.actionUsed") : "●"}
                  </div>
                ))}
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
            </div>
          )}

          <div className="panel__section">
            <div className="section-label">{t("battle.validActions", { n: unitActions.length })}</div>

            {isReplaying ? (
              <div className="hint">{t("battle.replayingHint")}</div>
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
