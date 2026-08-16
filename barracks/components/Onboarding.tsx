import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/* =============================================================================
   Prise en main — la visite guidée de la première ouverture.

   Elle ne raconte pas le jeu, elle situe l'atelier : où sont les unités, ce
   que coûte un réglage, où se lit la contrainte, par où l'on part en
   bataille. Quatre arrêts, aucun texte de plus de deux lignes, sortie
   possible à chaque écran.

   L'état est écrit en localStorage à la fin de l'étape 4 ou au premier
   « Passer » : la visite ne se montre qu'une fois. Elle se rejoue depuis le
   bouton d'aide de la barre d'outils.
   ========================================================================== */

const TOUR_KEY = "escarmouche_tour";

export const isTourDone = (): boolean => {
  try {
    return localStorage.getItem(TOUR_KEY) === "done";
  } catch {
    // localStorage indisponible : ne pas harceler l'utilisateur à chaque visite.
    return true;
  }
};

const markTourDone = (): void => {
  try {
    localStorage.setItem(TOUR_KEY, "done");
  } catch {
    /* sans persistance, la visite reviendra — acceptable */
  }
};

const STEPS = ["units", "cost", "budget", "battle"] as const;
type Step = (typeof STEPS)[number];

/** Visuels schématiques, un par arrêt — le style du châssis : traits, aplats. */
const StepArt: React.FC<{ step: Step }> = ({ step }) => {
  const stroke = "var(--text-dim)";
  const accent = "var(--accent)";

  switch (step) {
    case "units": // une carte d'unité stylisée
      return (
        <svg viewBox="0 0 120 84" className="tour__art" aria-hidden="true">
          <rect x="24" y="4" width="52" height="74" fill="none" stroke={stroke} />
          <rect x="30" y="10" width="40" height="24" fill="none" stroke={stroke} />
          <line x1="30" y1="42" x2="70" y2="42" stroke={accent} strokeWidth="2" />
          <line x1="30" y1="50" x2="62" y2="50" stroke={stroke} />
          <line x1="30" y1="57" x2="66" y2="57" stroke={stroke} />
          <line x1="30" y1="64" x2="58" y2="64" stroke={stroke} />
          <rect x="82" y="12" width="30" height="42" fill="none" stroke={stroke} opacity="0.4" />
        </svg>
      );
    case "cost": // une piste de réglage et le coût qui réagit
      return (
        <svg viewBox="0 0 120 84" className="tour__art" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={8 + i * 13}
              y="36"
              width="10"
              height="12"
              fill={i < 3 ? accent : "none"}
              stroke={i < 3 ? accent : stroke}
            />
          ))}
          <text x="96" y="50" fontSize="26" fontFamily="var(--font-num)" fill="var(--text)">12</text>
          <text x="96" y="62" fontSize="8" fill={stroke}>/ 30</text>
        </svg>
      );
    case "budget": // la jauge d'escouade
      return (
        <svg viewBox="0 0 120 84" className="tour__art" aria-hidden="true">
          <rect x="8" y="34" width="104" height="16" fill="none" stroke={stroke} />
          <rect x="10" y="36" width="34" height="12" fill={accent} />
          <rect x="46" y="36" width="24" height="12" fill={accent} opacity="0.7" />
          <rect x="72" y="36" width="16" height="12" fill={accent} opacity="0.45" />
          <text x="8" y="66" fontSize="9" fontFamily="var(--font-num)" fill={stroke}>76 / 100</text>
        </svg>
      );
    case "battle": // le plateau et sa zone centrale
      return (
        <svg viewBox="0 0 120 84" className="tour__art" aria-hidden="true">
          <rect x="26" y="8" width="68" height="68" fill="none" stroke={stroke} />
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <line x1={26 + i * 17} y1="8" x2={26 + i * 17} y2="76" stroke={stroke} opacity="0.35" />
              <line x1="26" y1={8 + i * 17} x2="94" y2={8 + i * 17} stroke={stroke} opacity="0.35" />
            </React.Fragment>
          ))}
          <rect x="43" y="25" width="34" height="34" fill="none" stroke={accent} strokeWidth="2" />
          <circle cx="35" cy="67" r="4" fill={accent} />
          <circle cx="86" cy="17" r="4" fill="var(--owner-ai)" />
        </svg>
      );
  }
};

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const finish = useCallback(() => {
    markTourDone();
    onClose();
  }, [onClose]);

  // Échap = « Passer » : même effet, même écriture d'état.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, finish]);

  if (!open) return null;

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t("tour.title")}>
      <div className="tour__panel">
        <div className="tour__header">
          <span className="section-label">{t("tour.title")}</span>
          <span className="num tour__counter">
            {index + 1} / {STEPS.length}
          </span>
        </div>

        <StepArt step={step} />

        <div className="tour__body">
          <h2 className="tour__step-title">{t(`tour.steps.${step}.title` as never)}</h2>
          <p className="tour__step-text">{t(`tour.steps.${step}.text` as never)}</p>
        </div>

        <div className="tour__dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={`tour__dot ${i === index ? "tour__dot--active" : ""}`} />
          ))}
        </div>

        <div className="tour__actions">
          <button className="btn btn--ghost" onClick={finish}>
            {t("tour.skip")}
          </button>
          <div className="spacer" />
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              {t("tour.previous")}
            </button>
          )}
          <button
            className="btn btn--primary"
            autoFocus
            onClick={() => (isLast ? finish() : setIndex(index + 1))}
          >
            {isLast ? t("tour.finish") : t("tour.next")}
          </button>
        </div>
      </div>
    </div>
  );
};
