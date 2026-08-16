import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BattleUnit, ActionDescription, BattleEffect } from "../battle";

const BOARD_SIZE = 8;
const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface BattleBoardProps {
  units: BattleUnit[];
  validActions: ActionDescription[];
  selectedUnitID: number | null;
  humanPlayerID: number;
  isHumanTurn: boolean;
  effects: BattleEffect[];
  isReplaying: boolean;
  /** Action survolée dans le panneau : la case correspondante s'illumine. */
  hoveredAction: ActionDescription | null;
  onUnitClick: (unitID: number) => void;
  onMoveClick: (x: number, y: number) => void;
  onActionClick: (action: ActionDescription) => void;
}

/** Repère de case tel qu'il est parlé à la table : « D5 ». */
export const cellName = (x: number, y: number): string => `${COLUMNS[x] ?? "?"}${y + 1}`;

/** Position d'une case dans la couche superposée, en unités de case. */
const placement = (x: number, y: number) =>
  ({ "--tx": x, "--ty": BOARD_SIZE - 1 - y }) as React.CSSProperties;

/** Familles de signature visuelle des capacités (cf. app.css). */
const ABILITY_FAMILY: Record<string, string> = {
  "00000-charge": "rush",
  "00005-command-forward": "rush",
  "00001-energy-trait": "beam",
  "00010-precision-shot": "beam",
  "00003-suppressing-fire": "wave",
  "00009-sweep": "wave",
  "00002-defensive-stance": "halo",
  "00008-guardian": "halo",
  "00011-overcharge": "halo",
  "00006-devastating-strike": "impact",
  "00004-tactical-retreat": "ghost",
  "00007-feint": "ghost",
};

/* =============================================================================
   Plateau 8×8.

   Les cases forment la grille et portent les surbrillances ; les jetons vivent
   dans une couche superposée, positionnés par `transform`. C'est ce qui permet
   à un déplacement de GLISSER d'une case à l'autre plutôt que de sauter : une
   transition CSS suffit, sans calcul de pixels en JavaScript.

   Le damier est thématisable, le code des surbrillances ne l'est pas : chaque
   état porte une FORME, un TRAIT et une TEINTE.
   ========================================================================== */
export const BattleBoard: React.FC<BattleBoardProps> = ({
  units,
  validActions,
  selectedUnitID,
  humanPlayerID,
  isHumanTurn,
  effects,
  isReplaying,
  hoveredAction,
  onUnitClick,
  onMoveClick,
  onActionClick,
}) => {
  const unitMap = useMemo(() => {
    const map: Record<string, BattleUnit> = {};
    for (const unit of units) map[`${unit.x},${unit.y}`] = unit;
    return map;
  }, [units]);

  const selectedUnit = units.find((u) => u.id === selectedUnitID) ?? null;

  const { moveCells, attackCells, abilityCells } = useMemo(() => {
    const moveCells = new Set<string>();
    const attackCells = new Set<number>();
    const abilityCells = new Set<string>();

    // Pendant le rejeu, le plateau raconte ce qui vient de se passer :
    // afficher en même temps les coups possibles brouillerait la lecture.
    if (selectedUnitID === null || isReplaying) {
      return { moveCells, attackCells, abilityCells };
    }

    for (const action of validActions) {
      if (action.sourceUnitID !== selectedUnitID) continue;
      if (action.type === "move") {
        moveCells.add(`${action.targetX},${action.targetY}`);
      } else if (action.type === "attack") {
        attackCells.add(action.targetUnitID);
      } else if (action.type === "ability") {
        if (action.targetUnitID >= 0) abilityCells.add(`unit:${action.targetUnitID}`);
        else if (action.targetX >= 0) abilityCells.add(`${action.targetX},${action.targetY}`);
      }
    }
    return { moveCells, attackCells, abilityCells };
  }, [validActions, selectedUnitID, isReplaying]);

  /** Case mise en avant par le survol d'une action dans le panneau. */
  const hoveredKey = useMemo(() => {
    if (!hoveredAction) return null;
    if (hoveredAction.type === "move") return `${hoveredAction.targetX},${hoveredAction.targetY}`;
    if (hoveredAction.targetUnitID >= 0) {
      const target = units.find((u) => u.id === hoveredAction.targetUnitID);
      return target ? `${target.x},${target.y}` : null;
    }
    if (hoveredAction.targetX >= 0) return `${hoveredAction.targetX},${hoveredAction.targetY}`;
    return null;
  }, [hoveredAction, units]);

  /** Dégâts prévisualisés sur la cible survolée, avant de cliquer. */
  const previewedDamage = useMemo(() => {
    if (!hoveredAction || hoveredAction.type !== "attack" || !selectedUnit) return null;
    return { unitID: hoveredAction.targetUnitID, amount: selectedUnit.power };
  }, [hoveredAction, selectedUnit]);

  const handleCellClick = (x: number, y: number) => {
    if (isReplaying) return;

    const posKey = `${x},${y}`;
    const unitAtCell = unitMap[posKey];

    if (unitAtCell) {
      if (isHumanTurn && unitAtCell.ownerID === humanPlayerID) {
        onUnitClick(unitAtCell.id);
        return;
      }
      if (attackCells.has(unitAtCell.id)) {
        const action = validActions.find(
          (a) => a.type === "attack" && a.sourceUnitID === selectedUnitID && a.targetUnitID === unitAtCell.id
        );
        if (action) { onActionClick(action); return; }
      }
      if (abilityCells.has(`unit:${unitAtCell.id}`)) {
        const action = validActions.find(
          (a) => a.type === "ability" && a.sourceUnitID === selectedUnitID && a.targetUnitID === unitAtCell.id
        );
        if (action) { onActionClick(action); return; }
      }
      return;
    }

    if (moveCells.has(posKey)) {
      onMoveClick(x, y);
      return;
    }
    if (abilityCells.has(posKey)) {
      const action = validActions.find(
        (a) => a.type === "ability" && a.sourceUnitID === selectedUnitID && a.targetX === x && a.targetY === y
      );
      if (action) { onActionClick(action); return; }
    }

    if (isHumanTurn) onUnitClick(-1);
  };

  const rows = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i);

  return (
    <div className="board-wrap">
      <div className="board-grid">
        <div className="board-ranks">
          {rows.map((y) => (
            <div key={y} className="board-coord">{y + 1}</div>
          ))}
        </div>

        <div>
          <div className="board-files">
            {COLUMNS.map((label) => (
              <div key={label} className="board-coord">{label}</div>
            ))}
          </div>

          <div className={`board ${isReplaying ? "board--replaying" : ""}`}>
            {rows.flatMap((y) =>
              Array.from({ length: BOARD_SIZE }, (_, x) => {
                const posKey = `${x},${y}`;
                const unit = unitMap[posKey];
                const isMove = moveCells.has(posKey);
                const isAttack = !!unit && attackCells.has(unit.id);
                const isAbilityCell = !unit && abilityCells.has(posKey);
                const isAbilityUnit = !!unit && abilityCells.has(`unit:${unit.id}`);
                const isDark = (x + y) % 2 === 0;

                const state = isMove
                  ? "move"
                  : isAttack
                  ? "attack"
                  : isAbilityCell || isAbilityUnit
                  ? "ability"
                  : undefined;

                const interactive =
                  !isReplaying &&
                  (isMove || isAttack || isAbilityCell || isAbilityUnit ||
                    (isHumanTurn && unit?.ownerID === humanPlayerID));

                // Les cases atteignables apparaissent en éventail depuis
                // l'unité : le geste de sélection prend du corps.
                const delay = selectedUnit && state
                  ? Math.max(Math.abs(x - selectedUnit.x), Math.abs(y - selectedUnit.y)) * 28
                  : 0;

                return (
                  <div
                    key={posKey}
                    role={interactive ? "button" : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    aria-label={cellName(x, y)}
                    style={state ? { animationDelay: `${delay}ms` } : undefined}
                    className={[
                      "cell",
                      isDark ? "cell--dark" : "cell--light",
                      state ? `cell--${state}` : "",
                      state ? "cell--reveal" : "",
                      hoveredKey === posKey ? "cell--hovered" : "",
                      interactive ? "cell--interactive" : "",
                    ].join(" ")}
                    onClick={() => handleCellClick(x, y)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleCellClick(x, y);
                      }
                    }}
                  >
                    {isMove && !unit && <span className="mark mark--move" aria-hidden="true" />}
                    {isAbilityCell && (
                      <svg className="mark mark--ability" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 4l8 8-8 8-8-8z" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}

            {/* Couche des jetons : positionnés par transform, donc animables */}
            <div className="board__tokens" aria-hidden="true">
              {units.map((unit) => (
                <div key={unit.id} className="token-wrap" style={placement(unit.x, unit.y)}>
                  <UnitToken
                    unit={unit}
                    isPlayer={unit.ownerID === humanPlayerID}
                    isSelected={unit.id === selectedUnitID}
                    isAttackTarget={attackCells.has(unit.id)}
                    isAbilityTarget={abilityCells.has(`unit:${unit.id}`)}
                    isHit={effects.some((e) => e.kind === "hit" && e.unitID === unit.id)}
                    lunge={effects.find((e) => e.kind === "lunge" && e.unitID === unit.id) ?? null}
                    previewDamage={
                      previewedDamage?.unitID === unit.id ? previewedDamage.amount : 0
                    }
                  />
                </div>
              ))}
            </div>

            {/* Couche des effets transitoires */}
            <div className="board__fx" aria-hidden="true">
              {effects.map((effect) => (
                <Effect key={effect.key} effect={effect} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <BoardLegend />
    </div>
  );
};

/* -----------------------------------------------------------------------------
   Effets
   -------------------------------------------------------------------------- */
const Effect: React.FC<{ effect: BattleEffect }> = ({ effect }) => {
  const style = placement(effect.x, effect.y);

  switch (effect.kind) {
    case "damage":
      return (
        <div className="fx fx--damage num" style={style}>
          −{effect.value}
        </div>
      );

    case "death":
      return (
        <div className="fx fx--death" style={style}>
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>
      );

    case "tracer": {
      // Le trait relie deux cases : on le dessine depuis la case source, sa
      // longueur et son angle se déduisent du vecteur.
      const dx = effect.x - (effect.fromX ?? effect.x);
      const dy = (effect.fromY ?? effect.y) - effect.y;
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      return (
        <div
          className="fx fx--tracer"
          style={{
            ...placement(effect.fromX ?? effect.x, effect.fromY ?? effect.y),
            ["--len" as string]: length,
            ["--angle" as string]: `${-angle}deg`,
          } as React.CSSProperties}
        />
      );
    }

    case "ability": {
      const family = ABILITY_FAMILY[effect.abilityID ?? ""] ?? "halo";
      const dx = effect.x - (effect.fromX ?? effect.x);
      const dy = (effect.fromY ?? effect.y) - effect.y;
      return (
        <div
          className={`fx fx--ability fx--ability-${family}`}
          style={{
            ...style,
            ["--len" as string]: Math.hypot(dx, dy),
            ["--angle" as string]: `${-(Math.atan2(dy, dx) * 180) / Math.PI}deg`,
          } as React.CSSProperties}
        />
      );
    }

    default:
      return null;
  }
};

/* -----------------------------------------------------------------------------
   Jeton
   -------------------------------------------------------------------------- */
interface UnitTokenProps {
  unit: BattleUnit;
  isPlayer: boolean;
  isSelected: boolean;
  isAttackTarget: boolean;
  isAbilityTarget: boolean;
  isHit: boolean;
  lunge: BattleEffect | null;
  previewDamage: number;
}

const UnitToken: React.FC<UnitTokenProps> = ({
  unit,
  isPlayer,
  isSelected,
  isAttackTarget,
  isAbilityTarget,
  isHit,
  lunge,
  previewDamage,
}) => {
  const { t } = useTranslation();

  const ratio = unit.maxHealth > 0 ? Math.max(0, unit.health / unit.maxHealth) : 0;
  const healthLevel = ratio > 0.6 ? "high" : ratio > 0.3 ? "mid" : "low";

  // Portion de la barre qui tomberait si l'attaque survolée était jouée.
  const previewRatio =
    previewDamage > 0 && unit.maxHealth > 0
      ? Math.min(ratio, previewDamage / unit.maxHealth)
      : 0;

  const statuses: string[] = [];
  if (unit.suppressed) statuses.push("suppressed");
  if (unit.untargetable) statuses.push("untargetable");
  if (unit.overcharged) statuses.push("overcharged");
  if (unit.defensiveStance) statuses.push("defensiveStance");

  // La ruée : un décalage vers la cible, absorbé par la transition du jeton.
  const lungeStyle: React.CSSProperties | undefined = lunge
    ? ({
        ["--lx" as string]: Math.sign(lunge.x - (lunge.fromX ?? lunge.x)),
        ["--ly" as string]: Math.sign((lunge.fromY ?? lunge.y) - lunge.y),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={[
        "token",
        isPlayer ? "token--player" : "token--ai",
        isSelected ? "token--selected" : "",
        isAttackTarget ? "token--attack" : "",
        isAbilityTarget ? "token--ability" : "",
        isHit ? "token--hit" : "",
        lunge ? "token--lunge" : "",
        unit.overcharged ? "token--overcharged" : "",
      ].join(" ")}
      style={lungeStyle}
      title={`${unit.name || t("battle.enemyUnit", { id: unit.id })} — ${unit.health}/${unit.maxHealth}`}
    >
      <div className="token__owner" />

      <div className="token__art">
        {unit.imageURL ? <img src={unit.imageURL} alt="" /> : <span>◆</span>}
      </div>

      {isAttackTarget && (
        <svg className="token__reticle" viewBox="0 0 24 24">
          <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
        </svg>
      )}

      <div className={`token__hp token__hp--${healthLevel}`}>
        <div className="token__hp-fill" style={{ width: `${ratio * 100}%` }} />
        {previewRatio > 0 && (
          <div
            className="token__hp-preview"
            style={{ width: `${previewRatio * 100}%`, right: `${(1 - ratio) * 100}%` }}
          />
        )}
      </div>

      {statuses.length > 0 && (
        <div className="token__statuses">
          {statuses.map((status) => (
            <span key={status} className="token__status" title={t(`battle.status.${status}` as never)}>
              {t(`battle.statusShort.${status}` as never)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** Légende : chaque état est décrit par sa forme autant que par sa teinte. */
const BoardLegend: React.FC = () => {
  const { t } = useTranslation();
  const items = [
    { key: "move", swatch: <span className="mark mark--move" /> },
    {
      key: "attack",
      swatch: (
        <svg className="legend__glyph legend__glyph--attack" viewBox="0 0 24 24">
          <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
        </svg>
      ),
    },
    {
      key: "ability",
      swatch: (
        <svg className="legend__glyph legend__glyph--ability" viewBox="0 0 24 24">
          <path d="M12 4l8 8-8 8-8-8z" />
        </svg>
      ),
    },
    { key: "selected", swatch: <span className="legend__glyph legend__glyph--selected" /> },
  ];

  return (
    <div className="legend">
      {items.map(({ key, swatch }) => (
        <div key={key} className="legend__item">
          <div className={`legend__cell legend__cell--${key}`}>{swatch}</div>
          <div className="stack">
            <span className="legend__label">{t(`battle.legend.${key}` as never)}</span>
            <span className="legend__shape">{t(`battle.legendShape.${key}` as never)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
