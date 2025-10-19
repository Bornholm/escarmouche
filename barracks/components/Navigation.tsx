import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { IgnoreTrans } from "./IgnoreTrans";

export const Navigation: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const location = useLocation();

  const toggleBurger = () => {
    setIsActive(!isActive);
  };

  const closeBurger = () => {
    setIsActive(false);
  };

  const isActiveRoute = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      className="navbar is-dark"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item" onClick={closeBurger}>
            <span
              className="title is-4 has-text-light"
              style={{ whiteSpace: "nowrap" }}
            >
              {t("navigation.title")}
            </span>
          </Link>

          <button
            className={`navbar-burger ${isActive ? "is-active" : ""}`}
            aria-label="menu"
            aria-expanded={isActive}
            data-target="navbarMenu"
            onClick={toggleBurger}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div
          id="navbarMenu"
          className={`navbar-menu ${isActive ? "is-active" : ""}`}
        >
          <div className="navbar-start">
            <Link
              to="/units"
              className={`navbar-item ${
                isActiveRoute("/units") ? "is-active" : ""
              }`}
              onClick={closeBurger}
            >
              <span className="icon">
                <i className="fas fa-users"></i>
              </span>
              <span>{t("navigation.units")}</span>
            </Link>

            <Link
              to="/squads"
              className={`navbar-item ${
                isActiveRoute("/squads") ? "is-active" : ""
              }`}
              onClick={closeBurger}
            >
              <span className="icon">
                <i className="fas fa-shield-alt"></i>
              </span>
              <span>{t("navigation.squads")}</span>
            </Link>

            <Link
              target="_blank"
              to={`https://bornholm.github.io/escarmouche/${
                i18n.language
              }-${i18n.language.toUpperCase()}/`}
              className={`navbar-item`}
              onClick={closeBurger}
            >
              <span className="icon">
                <i className="fas fa-external-link-alt"></i>
              </span>
              <span>{t("navigation.rules")}</span>
            </Link>
          </div>

          <div className="navbar-end">
            <div className="navbar-item has-dropdown is-hoverable">
              <a className="navbar-link">
                <span className="icon">
                  <i className="fas fa-globe"></i>
                </span>
                <span>{t("navigation.language")}</span>
              </a>
              <div className="navbar-dropdown is-right">
                <a
                  className="navbar-item"
                  onClick={() => i18n.changeLanguage("fr")}
                  style={{ cursor: "pointer" }}
                >
                  <IgnoreTrans>🇫🇷 Français</IgnoreTrans>
                </a>
                <a
                  className="navbar-item"
                  onClick={() => i18n.changeLanguage("en")}
                  style={{ cursor: "pointer" }}
                >
                  <IgnoreTrans>🇬🇧 English</IgnoreTrans>
                </a>
                <a
                  className="navbar-item"
                  onClick={() => i18n.changeLanguage("es")}
                  style={{ cursor: "pointer" }}
                >
                  <IgnoreTrans>🇪🇸 Español</IgnoreTrans>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
