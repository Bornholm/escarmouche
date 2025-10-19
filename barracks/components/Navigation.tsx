import React, { useState } from "react";
import { Link, useLocation } from "react-router";

export const Navigation: React.FC = () => {
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
            <span className="title is-4 has-text-light">La Caserne</span>
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
              <span>Unités</span>
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
              <span>Escouades</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
