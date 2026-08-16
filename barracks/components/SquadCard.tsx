import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Squad } from "../types";
import { useEvaluations } from "../hooks/useEvaluations";
import { formatCost, maxSquadSize, squadBudget } from "../util/rank";
import { RankIcon, TrashIcon } from "./Icons";

interface SquadCardProps {
  squad: Squad;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SquadCard: React.FC<SquadCardProps> = ({ squad, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const evaluations = useEvaluations(squad.units);
  const maxPoints = squadBudget();
  const spent = useMemo(
    () => squad.units.reduce((total, unit) => total + (evaluations[unit.id]?.cost ?? 0), 0),
    [squad.units, evaluations]
  );

  return (
    <article className="squad-card">
      <div className="squad-card__head">
        <div className="grow-min">
          <div className="squad-card__name">{squad.name}</div>
          <div className="section-label">
            {t("squadEditor.unitCount", { n: squad.units.length, max: maxSquadSize() })}
          </div>
        </div>

        <div className="stack" >
          <span className="num" style={{ fontSize: "var(--type-xl)", fontWeight: 700 }}>
            {formatCost(Math.round(spent * 10) / 10)}
          </span>

          <span className="section-label">/ {maxPoints} {t("card.pointsShort")}</span>
        </div>
      </div>
      {/* La consommation du budget est le véhicule visuel principal, ici aussi */}
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

      {squad.description && (
        <p className="squad-card__lore">{squad.description}</p>
      )}

      <div className="squad-card__roster">
        {squad.units.length === 0 ? (
          <span className="hint">{t("squads.noUnitsInSquad")}</span>
        ) : (
          squad.units.map((unit, index) => (
            <div key={`${unit.id}-${index}`} className="squad-card__unit">
              <RankIcon rank={evaluations[unit.id]?.rank} size={13} color="var(--accent)" />

              <span className="break-anywhere">{unit.name}</span>
              <span className="squad-card__unit-points">{formatCost(evaluations[unit.id]?.cost)}</span>
            </div>
          ))
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="row row--2">
          {onEdit && (
            <button className="btn btn--sm" style={{ flex: 1 }} onClick={onEdit}>
              {t("squads.edit")}
            </button>
          )}
          {onDelete && (
            <button
              className="iconbtn"
              aria-label={`${t("squads.delete")} — ${squad.name}`}
              onClick={onDelete}
>
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </article>
  );
};
