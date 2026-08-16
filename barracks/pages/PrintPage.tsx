import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Unit } from "../types";
import { UnitCard } from "../components/UnitCard";
import { BackIcon, PrintIcon } from "../components/Icons";

interface PrintPageProps {
  units: Unit[];
}

/* =============================================================================
   Feuille d'impression.
   La carte finit sur la table, à côté de la figurine : c'est le seul écran dont
   le livrable est un objet physique. Le mode impression (cf. tokens.css) force
   le thème clair, retire les aplats sombres, garde les filets et désature
   l'illustration pour rester lisible en noir et blanc.
   Les cartes sont jointives : moins de coups de cutter qu'avec des marges.
   ========================================================================== */

export const PrintPage: React.FC<PrintPageProps> = ({ units }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // On mémorise les unités ÉCARTÉES, pas les sélectionnées : les unités sont
  // chargées après le premier rendu (localStorage lu dans un effet de App), et
  // une sélection initialisée à `units` resterait vide pour toujours.
  const [excluded, setExcluded] = useState<string[]>([]);
  const toggle = (id: string) => {
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toPrint = units.filter((unit) => !excluded.includes(unit.id));

  return (
    <>
      <div className="page__head screen-only">
        <button className="btn btn--sm" onClick={() => navigate("/units")}>
          <BackIcon />
          {t("unitEditor.back")}
        </button>

        <h1 className="page__title">{t("print.title")}</h1>
        <span className="section-label">{t("print.format")}</span>
        <div className="spacer" />

        <button className="btn btn--primary btn--sm" onClick={() => window.print()}>
          <PrintIcon />
          {t("print.action")}
        </button>
      </div>

      <div className="panel__section screen-only">
        <div className="section-label">{t("print.selection")}</div>
        <div className="row row--2 row--wrap">
          {units.map((unit) => (
            <label key={unit.id} className="row row--2" style={{ gap: "var(--space-2)" }}>
              <input
                type="checkbox"
                checked={!excluded.includes(unit.id)}
                onChange={() => toggle(unit.id)}
              />

              <span style={{ fontSize: "var(--type-md)" }}>{unit.name}</span>
            </label>
          ))}
        </div>

        <div className="hint">{t("print.hint", { n: toPrint.length })}</div>
      </div>

      <div className="print-sheet print-preview">
        {toPrint.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>
    </>
  );
};
