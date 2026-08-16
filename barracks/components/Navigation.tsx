import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { IgnoreTrans } from "./IgnoreTrans";
import { normalizeLocale } from "../util/locale";
import { Mode, Universe, UNIVERSES } from "../util/theme";
import {
  BattleIcon,
  BrandIcon,
  ExternalIcon,
  GlobeIcon,
  MenuIcon,
  ModeIcon,
  RulesIcon,
  SquadsIcon,
  UnitsIcon,
  UniverseIcon,
  HelpIcon,
} from "./Icons";

interface NavigationProps {
  mode: Mode;
  universe: Universe;
  onModeChange: (mode: Mode) => void;
  onUniverseChange: (universe: Universe) => void;
  onReplayTour: () => void;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
];

/** Ferme un menu quand on clique ailleurs — le survol ne suffit pas au tactile. */
const useDismiss = (onDismiss: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onDismiss]);
  return ref;
};

export const Navigation: React.FC<NavigationProps> = ({
  mode,
  universe,
  onModeChange,
  onUniverseChange,
  onReplayTour,
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [universeOpen, setUniverseOpen] = useState(false);

  const langRef = useDismiss(() => setLangOpen(false));
  const universeRef = useDismiss(() => setUniverseOpen(false));

  const isActive = (path: string) => location.pathname.startsWith(path);
  const close = () => setNavOpen(false);

  const links = [
    { to: "/units", label: t("navigation.units"), Icon: UnitsIcon },
    { to: "/squads", label: t("navigation.squads"), Icon: SquadsIcon },
    { to: "/battle", label: t("navigation.battle"), Icon: BattleIcon },
  ];

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand" onClick={close}>
        <BrandIcon size={20} color="var(--accent)" />
        <span>{t("navigation.title")}</span>
      </Link>

      <button
        className="topbar__burger"
        aria-label={t("navigation.menu")}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((open) => !open)}
      >
        <MenuIcon />
      </button>

      <nav className="topbar__nav" hidden={!navOpen} id="main-nav">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={close}
            className={`navlink ${isActive(to) ? "navlink--active" : ""}`}
            aria-current={isActive(to) ? "page" : undefined}
          >
            <Icon />
            {label}
          </Link>
        ))}
        <a
          className="navlink"
          target="_blank"
          rel="noreferrer"
          onClick={close}
          href={`https://bornholm.github.io/escarmouche/${normalizeLocale(i18n.language)}/`}
        >
          <RulesIcon />
          {t("navigation.rules")}
          <ExternalIcon />
        </a>
      </nav>

      <div className="topbar__spacer" />

      <div className="topbar__tools">
        <div className="menu" ref={langRef}>
          <button
            className="toolbtn"
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((open) => !open)}
          >
            <GlobeIcon />
            <IgnoreTrans>{i18n.language.slice(0, 2).toUpperCase()}</IgnoreTrans>
          </button>
          {langOpen && (
            <div className="menu__panel" role="menu">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  role="menuitem"
                  className={`menu__item ${i18n.language.startsWith(code) ? "menu__item--active" : ""}`}
                  onClick={() => {
                    i18n.changeLanguage(code);
                    setLangOpen(false);
                  }}
                >
                  <IgnoreTrans>{label}</IgnoreTrans>
                  {i18n.language.startsWith(code) && <span className="menu__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="toolbtn"
          onClick={() => onModeChange(mode === "dark" ? "light" : "dark")}
          aria-label={t("theme.toggleMode")}
        >
          <ModeIcon />
          {t(`theme.mode.${mode}` as never)}
        </button>

        <div className="menu" ref={universeRef}>
          <button
            className="toolbtn"
            aria-haspopup="menu"
            aria-expanded={universeOpen}
            onClick={() => setUniverseOpen((open) => !open)}
          >
            <UniverseIcon />
            {t(`theme.universe.${universe}` as never)}
          </button>
          {universeOpen && (
            <div className="menu__panel" role="menu">
              {UNIVERSES.map((name) => (
                <button
                  key={name}
                  role="menuitem"
                  className={`menu__item ${universe === name ? "menu__item--active" : ""}`}
                  onClick={() => {
                    onUniverseChange(name);
                    setUniverseOpen(false);
                  }}
                >
                  {t(`theme.universe.${name}` as never)}
                  {universe === name && <span className="menu__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="toolbtn" onClick={onReplayTour} aria-label={t("tour.replay")}>
          <HelpIcon />
        </button>
      </div>
    </header>
  );
};
