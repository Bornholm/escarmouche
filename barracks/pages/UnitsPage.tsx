import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Unit } from "../types";
import { Card } from "../components/Card";

interface UnitsPageProps {
  units: Unit[];
  onDeleteUnit: (unitId: string) => void;
}

export const UnitsPage: React.FC<UnitsPageProps> = ({
  units,
  onDeleteUnit,
}) => {
  const { t } = useTranslation();
  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">{t("units.title")}</h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <Link to="/units/new" className="button">
                <span className="icon">
                  <i className="fas fa-plus"></i>
                </span>
                <span>{t("units.newUnit")}</span>
              </Link>
            </div>
          </div>
        </div>

        {units.length === 0 ? (
          <div className="notification">
            <p className="has-text-centered">{t("units.noUnits")}</p>
          </div>
        ) : (
          <div className="columns is-multiline is-mobile">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="column is-12-mobile is-6-tablet is-4-desktop"
              >
                <div className="card">
                  <div className="card-content is-flex is-justify-content-center">
                    <Card unit={unit} />
                  </div>
                  <footer className="card-footer">
                    <Link
                      to={`/units/${unit.id}/edit`}
                      className="card-footer-item button is-ghost"
                    >
                      <span className="icon">
                        <i className="fas fa-edit"></i>
                      </span>
                      <span>{t("units.edit")}</span>
                    </Link>
                    <button
                      onClick={() => onDeleteUnit(unit.id)}
                      className="card-footer-item button is-ghost has-text-danger"
                    >
                      <span className="icon">
                        <i className="fas fa-trash"></i>
                      </span>
                      <span>{t("units.delete")}</span>
                    </button>
                  </footer>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
