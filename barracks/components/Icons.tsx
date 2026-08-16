import React from "react";
import { Archetype, Rank } from "../types";

/* =============================================================================
   Jeu de pictogrammes du châssis neutre.

   Règle du système : aucun des pictogrammes métier n'emprunte à un équipement.
   Pas de cœur pour la Santé, pas d'épée pour la Puissance, pas de botte pour le
   Mouvement — un régiment napoléonien, un commando spatial et une équipe
   d'animaux de la ferme doivent lire les mêmes formes.

   Un thème d'univers peut fournir un jeu figuratif (--icon-set), mais la
   sémantique de chaque forme est fixe.
   ========================================================================== */

interface IconProps {
  size?: number;
  className?: string;
  /** Par défaut l'icône hérite de la couleur du texte courant. */
  color?: string;
  strokeWidth?: number;
}

const base = (size: number, strokeWidth: number, color?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: color ?? "currentColor",
  strokeWidth,
  "aria-hidden": true as const,
  focusable: "false" as const,
});

/* -----------------------------------------------------------------------------
   Les 4 caractéristiques — géométrie mnémonique
   -------------------------------------------------------------------------- */

/** Enceinte + noyau : ce qu'on protège. */
export const HealthIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.6, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <rect x="3.5" y="3.5" width="17" height="17" />
    <rect x="8.5" y="8.5" width="7" height="7" fill="currentColor" stroke="none" />
  </svg>
);

/** Arcs concentriques : la distance atteinte. */
export const RangeIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.6, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <circle cx="4.5" cy="19.5" r="1.8" fill="currentColor" stroke="none" />
    <path d="M4.5 13.5a6 6 0 0 1 6 6" />
    <path d="M4.5 7.5a12 12 0 0 1 12 12" />
  </svg>
);

/** Pic sur une base : l'amplitude du coup. */
export const PowerIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.6, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M3 20.5h18" />
    <path d="M7 20.5 12 4l5 16.5z" fill="currentColor" stroke="none" />
  </svg>
);

/** Chemin en marches : le déplacement en cases. */
export const MoveIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.6, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M3 18h6v-6h6V6" />
    <path d="M11.5 6H15v3.5" />
  </svg>
);

export type StatKey = "health" | "range" | "power" | "move";

export const StatIcon: React.FC<IconProps & { stat: StatKey }> = ({ stat, ...rest }) => {
  switch (stat) {
    case "health": return <HealthIcon {...rest} />;
    case "range": return <RangeIcon {...rest} />;
    case "power": return <PowerIcon {...rest} />;
    case "move": return <MoveIcon {...rest} />;
  }
};

/* -----------------------------------------------------------------------------
   Les 5 rangs — le contour gagne des côtés
   Segment · triangle · carré à cœur · pentagone à cœur · hexagone plein.
   Le rang se lit à la silhouette, donc en noir et blanc et à 15 px comme à 52.
   -------------------------------------------------------------------------- */

export const RankIcon: React.FC<IconProps & { rank?: Rank | string }> = ({
  rank,
  size = 24,
  strokeWidth = 1.5,
  color,
}) => {
  const props = base(size, strokeWidth, color);
  switch (rank) {
    case Rank.Veteran:
      return <svg {...props}><path d="M12 5.5 20 19H4z" /></svg>;
    case Rank.Elite:
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" />
          <rect x="8.5" y="8.5" width="7" height="7" fill="currentColor" stroke="none" />
        </svg>
      );
    case Rank.Champion:
      return (
        <svg {...props}>
          <path d="M12 2.8 21.2 9.5 17.7 20.4H6.3L2.8 9.5z" />
          <path d="M12 7.6 16.9 11.2 15 17H9l-1.9-5.8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case Rank.Paragon:
      return <svg {...props}><path d="M12 2.6 21 8v8L12 21.4 3 16V8z" fill="currentColor" stroke="none" /></svg>;
    case Rank.Trooper:
    default:
      return <svg {...props}><path d="M4 12h16" /></svg>;
  }
};

/** Code court affiché sous le badge : R1 … R5. */
export const RANK_ORDER: Rank[] = [
  Rank.Trooper,
  Rank.Veteran,
  Rank.Elite,
  Rank.Champion,
  Rank.Paragon,
];

export const rankCode = (rank?: Rank | string): string => {
  const index = RANK_ORDER.indexOf(rank as Rank);
  return index === -1 ? "—" : `R${index + 1}`;
};

/* -----------------------------------------------------------------------------
   Les 6 archétypes — le rôle, pas l'équipement
   « Sniper » désigne autant un arbalétrier qu'un tireur d'élite : les formes
   traduisent le rôle tactique, jamais l'armement.
   -------------------------------------------------------------------------- */

export const ArchetypeIcon: React.FC<IconProps & { archetype: Archetype | string }> = ({
  archetype,
  size = 18,
  strokeWidth = 1.6,
  color,
}) => {
  const props = base(size, strokeWidth, color);
  switch (archetype) {
    case Archetype.Tank: // Coque épaisse, petit cœur
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        </svg>
      );
    case Archetype.Sniper: // Point d'origine, cible lointaine
      return (
        <svg {...props}>
          <circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="18" cy="6" r="4" />
          <path d="M18 1v3M18 8v3M13 6h3M20 6h3" />
        </svg>
      );
    case Archetype.Skirmisher: // Trajet brisé : la mobilité
      return <svg {...props}><path d="M2 18l5-6 4 4 5-8 6 6" /></svg>;
    case Archetype.Bruiser: // Deux masses au contact
      return (
        <svg {...props}>
          <path d="M4 8h6l2 4-2 4H4z" fill="currentColor" stroke="none" />
          <path d="M20 8h-4l-2 4 2 4h4" />
        </svg>
      );
    case Archetype.GlassCannon: // Masse pleine, base discontinue
      return (
        <svg {...props}>
          <path d="M6 17 12 3l6 14z" fill="currentColor" stroke="none" />
          <path d="M3 21h4M10 21h4M17 21h4" />
        </svg>
      );
    case Archetype.JackOfAllTrades: // Quatre quadrants égaux
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5v17M3.5 12h17" />
        </svg>
      );
  }
};

/* -----------------------------------------------------------------------------
   Icônes d'interface — invariantes, jamais redéfinies par un univers
   -------------------------------------------------------------------------- */

export const BrandIcon: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.6, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M12 2.6 21 8v8L12 21.4 3 16V8z" />
    <path d="M12 2.6V21.4" />
  </svg>
);

export const UnitsIcon: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <rect x="3" y="4" width="7" height="7" />
    <rect x="14" y="4" width="7" height="7" />
    <rect x="3" y="15" width="7" height="7" />
    <rect x="14" y="15" width="7" height="7" />
  </svg>
);

export const SquadsIcon: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M12 3 20 6.5v6.2c0 4.3-3.3 7.2-8 8.3-4.7-1.1-8-4-8-8.3V6.5z" />
  </svg>
);

export const BattleIcon: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <rect x="3" y="3" width="18" height="18" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

export const RulesIcon: React.FC<IconProps> = ({ size = 15, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M4 4h7v16H4z" />
    <path d="M13 4h7v16h-7z" />
  </svg>
);

export const ExternalIcon: React.FC<IconProps> = ({ size = 10, strokeWidth = 2.2, color }) => (
  <svg {...base(size, strokeWidth, color)} style={{ opacity: 0.55 }}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
);

export const ModeIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
);

export const UniverseIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M3 7h18M3 12h18M3 17h18" />
  </svg>
);

export const BackIcon: React.FC<IconProps> = ({ size = 13, strokeWidth = 2, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M14 6l-6 6 6 6" /></svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M12 5v14M5 12h14" /></svg>
);

export const MinusIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M5 12h14" /></svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 12, strokeWidth = 2, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M5 5l14 14M19 5 5 19" /></svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 13, strokeWidth = 1.8, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ size = 26, strokeWidth = 1.5, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 16v3h16v-3" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.8, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const SortIcon: React.FC<IconProps> = ({ size = 13, strokeWidth = 1.8, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);

export const GenerateIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.8, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4h-4" />
  </svg>
);

export const NoImageIcon: React.FC<IconProps> = ({ size = 46, strokeWidth = 1.2, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <rect x="2.5" y="4.5" width="19" height="15" />
    <path d="M2.5 15.5 8 10l4.5 4.5L16 11l5.5 5.5" />
    <circle cx="16.5" cy="8.5" r="1.6" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, color }) => (
  <svg {...base(size, strokeWidth, color)}><path d="M3 7h18M3 12h18M3 17h18" /></svg>
);

/** Unité hors budget : le cadenas remplace le bouton d'ajout. */
export const LockIcon: React.FC<IconProps> = ({ size = 13, strokeWidth = 1.8, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M6 11V8a6 6 0 0 1 12 0v3" />
    <rect x="5" y="11" width="14" height="9" />
  </svg>
);

export const PrintIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 1.7, color }) => (
  <svg {...base(size, strokeWidth, color)}>
    <path d="M7 9V3h10v6" />
    <path d="M4 9h16v7h-3v5H7v-5H4z" />
  </svg>
);
