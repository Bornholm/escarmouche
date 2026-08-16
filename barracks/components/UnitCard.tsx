import React from "react";
import { useTranslation } from "react-i18next";
import { Evaluation, Unit } from "../types";
import { useAsyncMemo } from "../hooks/useAsyncMemo";
import { useAbilities, resolveAbilities } from "../hooks/useAbilities";
import { formatCost } from "../util/rank";
import { NoImageIcon, RankIcon, StatIcon, StatKey, rankCode } from "./Icons";

interface UnitCardProps {
  unit: Unit;

  /** `preview` réduit la carte sans déplacer aucun de ses éléments. */
  variant?: "full" | "preview";
  className?: string;
}

const STATS: StatKey[] = ["health", "range", "power", "move"];

/* =============================================================================
   La carte d'unité — l'objet identitaire du produit.
   Sa structure ne bouge dans aucun thème : bandeau d'identité, fenêtre
   d'illustration, bandeau de caractéristiques, pile de capacités. Seuls la
   bordure, les polices, la palette et les pictogrammes varient d'un univers à
   l'autre. Le cadre est un écrin : l'illustration fournie par l'utilisateur
   est la seule source d'univers sur la carte.
   ========================================================================== */

export const UnitCard: React.FC<UnitCardProps> = ({ unit, variant = "full", className }) => {
  const { t } = useTranslation();
  const catalog = useAbilities();
  const evaluation = useAsyncMemo<Evaluation>(() => Barracks.evaluateUnit(unit), [unit]);
  const abilities = resolveAbilities(unit.abilities, catalog);

  return (
    <article className={`unit-card ${variant === "preview" ? "unit-card--preview" : ""} ${className ?? ""}`}>
      <header className="unit-card__head">
        <div className="unit-card__ident">
          <div className="unit-card__rank">
            {evaluation ? t(`ranks.${evaluation.rank}` as never) : " "}
          </div>

          <div className="unit-card__name">{unit.name}</div>
        </div>

        <div className="unit-card__badge">
          <RankIcon rank={evaluation?.rank} size={variant === "preview" ? 22 : 30} color="var(--accent)" />

          <span className="unit-card__badge-code">{rankCode(evaluation?.rank)}</span>
        </div>
      </header>

      <div className="unit-card__art">
        {unit.imageUrl ? (
          <img src={unit.imageUrl} alt="" />
        ) : (
          <div className="unit-card__fallback">
            <NoImageIcon size={variant === "preview" ? 32 : 46} color="var(--border-strong)" />

            <span>{t("card.noIllustration")}</span>
          </div>
        )}
        {evaluation && (
          <div className="unit-card__cost">{t("card.points", { points: formatCost(evaluation?.cost) })}</div>
        )}
      </div>

      <div className="unit-card__stats">
        {STATS.map((stat) => (
          <div key={stat} className="unit-card__stat">
            <StatIcon stat={stat} size={variant === "preview" ? 14 : 20} color="var(--text-dim)" />

            <div className="unit-card__stat-num">{unit[stat]}</div>
            <div className="unit-card__stat-label">{t(`stats.${stat}` as never)}</div>
          </div>
        ))}
      </div>

      <div className="unit-card__abilities">
        {abilities.length === 0 && !unit.quote ? (
          <div className="unit-card__none">{t("card.noAbility")}</div>
        ) : (
          abilities.map((ability, index) => (
            <div key={ability.id} className="unit-card__ability">
              <span className="unit-card__ability-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="grow-min">
                <div className="unit-card__ability-name">{ability.label}</div>
                <div className="unit-card__ability-desc">{ability.description}</div>
              </div>

              <span className="unit-card__ability-cost">+{ability.cost}</span>
            </div>
          ))
        )}

        {unit.quote && (
          <div className="unit-card__quote">{unit.quote}</div>
        )}
      </div>
    </article>
  );
};
