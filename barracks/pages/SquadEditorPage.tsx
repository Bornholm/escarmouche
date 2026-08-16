import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad, Unit } from "../types";
import { generateId } from "../util/storage";
import { useEvaluations } from "../hooks/useEvaluations";
import { useAbilities, resolveAbilities } from "../hooks/useAbilities";
import { formatCost, maxSquadSize, squadBudget } from "../util/rank";
import { LockIcon, MinusIcon, PlusIcon, RankIcon } from "../components/Icons";

interface SquadEditorPageProps {
  squads: Squad[];
  availableUnits: Unit[];
  onSave: (squad: Squad) => void;
}

/* =============================================================================
   Éditeur d'escouade.
   Le budget est le sujet de l'écran : la jauge est en tête et ne bouge jamais.
   Une unité qu'on ne peut pas s'offrir est barrée d'une trame et porte son
   dépassement chiffré — elle se lit comme hors de portée avant d'être cliquée.
   ========================================================================== */

export const SquadEditorPage: React.FC<SquadEditorPageProps> = ({
  squads,
  availableUnits,
  onSave,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined && id !== "new";
  const existingSquad = isEditing ? squads.find((s) => s.id === id) : undefined;
  const [squad, setSquad] = useState<Squad>({ id: generateId(), name: "", units: [] });
  const catalog = useAbilities();
  const evaluations = useEvaluations(availableUnits);
  const maxPoints = squadBudget();
  const maxSize = maxSquadSize();
  useEffect(() => {
    if (existingSquad) setSquad({ ...existingSquad });
  }, [existingSquad]);
  const spent = useMemo(
    () => squad.units.reduce((total, unit) => total + (evaluations[unit.id]?.cost ?? 0), 0),
    [squad.units, evaluations]
  );
  const remaining = maxPoints - spent;
  const freeSlots = maxSize - squad.units.length;
  const describe = (unit: Unit): string => {
    const rank = evaluations[unit.id]?.rank;
    const names = resolveAbilities(unit.abilities, catalog).map((a) => a.label);
    const rankLabel = rank ? t(`ranks.${rank}` as never) : "—";
    return names.length ? `${rankLabel} · ${names.join(", ")}` : rankLabel;
  };

  const addUnit = (unit: Unit) => {
    if (freeSlots <= 0) return;
    if ((evaluations[unit.id]?.cost ?? 0) > remaining) return;
    setSquad((prev) => ({ ...prev, units: [...prev.units, unit] }));
  };

  const removeUnit = (index: number) => {
    setSquad((prev) => ({ ...prev, units: prev.units.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!squad.name.trim()) return;
    onSave(squad);
    navigate("/squads");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="squad-bar">
        <div className="squad-bar__main">
          <div className="row row--3 row--wrap">
            <input
              className="input squad-bar__name"
              type="text"
              required
              value={squad.name}
              placeholder={t("squadEditor.squadNamePlaceholder")}
              onChange={(event) => setSquad((prev) => ({ ...prev, name: event.target.value }))}
            />

            <span className="section-label">{t("squadEditor.squadName")}</span>
          </div>

          <textarea
            className="input input--lore"
            rows={2}
            maxLength={500}
            value={squad.description ?? ""}
            placeholder={t("squadEditor.descriptionPlaceholder")}
            onChange={(event) =>
              setSquad((prev) => ({ ...prev, description: event.target.value || undefined }))
            }
          />

          <div className="row row--4 row--wrap">
            <div className="stack stack--2" style={{ flex: 1, minWidth: 260 }}>
              <div className="row">
                <span className="field__label">{t("squadEditor.pointsSpent")}</span>
                <div className="spacer" />

                <span className="num" className="meta-sm">
                  {t("squadEditor.remaining", { points: formatCost(remaining) })}
                </span>
              </div>
              {/* Jauge de budget : un segment par unité, à l'échelle de son coût */}
              <div className="budget">
                {squad.units.map((unit, index) => {
                  const points = evaluations[unit.id]?.cost ?? 0;

                  return (
                    <div
                      key={`${unit.id}-${index}`}
                      className="budget__seg"
                      style={{ width: `${(points / maxPoints) * 100}%` }}
                      title={`${unit.name} — ${formatCost(points)}`}
>
                      {formatCost(points)}
                    </div>
                  );
                })}
                <div className="budget__rest">{maxPoints}</div>
              </div>
            </div>

            <div className="squad-bar__totals">
              <div className="row row--2" >
                <span className="squad-bar__spent">{formatCost(Math.round(spent * 10) / 10)}</span>
                <span className="eval__max">/ {maxPoints} pts</span>
              </div>

              <div className="section-label">
                {t("squadEditor.unitCount", { n: squad.units.length, max: maxSize })}
              </div>
            </div>
          </div>
        </div>

        <div className="squad-bar__actions">
          <button type="submit" className="btn btn--primary btn--block" style={{ flex: 1 }}>
            {isEditing ? t("squadEditor.edit") : t("squadEditor.create")}
          </button>

          <button type="button" className="btn btn--ghost btn--block" onClick={() => navigate("/squads")}>
            {t("squadEditor.cancel")}
          </button>
        </div>
      </div>

      <div className="squad-cols">
        <section>
          <div className="squad-cols__head">
            <span className="section-label">{t("squadEditor.currentSquad")}</span>
          </div>
          {squad.units.map((unit, index) => (
            <div key={`${unit.id}-${index}`} className="squad-row">
              <div className="squad-row__art">
                {unit.imageUrl && <img src={unit.imageUrl} alt="" />}
              </div>

              <RankIcon rank={evaluations[unit.id]?.rank} size={16} strokeWidth={1.6} color="var(--accent)" />

              <div className="grow-min">
                <div className="squad-row__name">{unit.name}</div>
                <div className="squad-row__meta">{describe(unit)}</div>
              </div>

              <div className="squad-row__points num">{formatCost(evaluations[unit.id]?.cost)}</div>
              <button
                type="button"
                className="iconbtn"
                aria-label={`${t("squadEditor.remove")} — ${unit.name}`}
                onClick={() => removeUnit(index)}
>
                <MinusIcon size={12} />
              </button>
            </div>
          ))}
          <div className="squad-row squad-row--free">
            <div className="squad-row__art squad-row__art--empty" />

            <div className="hint">
              {t("squadEditor.freeSlots", { slots: freeSlots, points: formatCost(remaining) })}
            </div>
          </div>
        </section>

        <section>
          <div className="squad-cols__head">
            <span className="section-label">{t("squadEditor.availableUnits")}</span>
            <span className="hint">{t("squadEditor.clickToAddUnit")}</span>
          </div>
          {availableUnits.length === 0 && (
            <div className="notice" style={{ margin: "var(--space-4) var(--space-6)" }}>
              {t("squadEditor.noAvailableUnits")}
            </div>
          )}
          {availableUnits.map((unit) => {
            const points = evaluations[unit.id]?.cost ?? 0;
            const overrun = points - remaining;
            const unaffordable = overrun > 0 || freeSlots <= 0;

            return (
              <div
                key={unit.id}
                className={`squad-row ${unaffordable ? "squad-row--locked" : "squad-row--add"}`}
                onClick={() => !unaffordable && addUnit(unit)}
                role={unaffordable ? undefined : "button"}
                tabIndex={unaffordable ? undefined : 0}
                onKeyDown={(event) => {
                  if (!unaffordable && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    addUnit(unit);
                  }
                }}
>
                <div className="squad-row__art">
                  {unit.imageUrl && <img src={unit.imageUrl} alt="" />}
                </div>

                <RankIcon
                  rank={evaluations[unit.id]?.rank}
                  size={16}
                  strokeWidth={1.6}
                  color={unaffordable ? "var(--text-faint)" : "var(--accent)"}
                />

                <div className="grow-min">
                  <div className="squad-row__name">{unit.name}</div>
                  <div className={`squad-row__meta ${unaffordable ? "squad-row__meta--over" : ""}`}>
                    {overrun > 0
                      ? t("squadEditor.exceedsBudget", { points: formatCost(overrun) })
                      : freeSlots <= 0
                      ? t("squadEditor.squadFull")
                      : describe(unit)}
                  </div>
                </div>

                <div className={`squad-row__points num ${overrun > 0 ? "squad-row__points--over" : ""}`}>
                  {formatCost(points)}
                </div>
                {unaffordable ? (
                  <div className="squad-row__lock" aria-hidden="true">
                    <LockIcon />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="iconbtn iconbtn--add"
                    aria-label={`${t("squadEditor.clickToAddUnit")} — ${unit.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      addUnit(unit);
                    }}
>
                    <PlusIcon size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </form>
  );
};
