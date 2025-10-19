import React from "react";
import { Link } from "react-router";
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
  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">Unités</h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <Link to="/units/new" className="button">
                <span className="icon">
                  <i className="fas fa-plus"></i>
                </span>
                <span>Nouvelle unité</span>
              </Link>
            </div>
          </div>
        </div>

        {units.length === 0 ? (
          <div className="notification">
            <p className="has-text-centered">
              Aucune unité créée. Cliquez sur "Nouvelle unité" pour commencer.
            </p>
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
                      <span>Modifier</span>
                    </Link>
                    <button
                      onClick={() => onDeleteUnit(unit.id)}
                      className="card-footer-item button is-ghost has-text-danger"
                    >
                      <span className="icon">
                        <i className="fas fa-trash"></i>
                      </span>
                      <span>Supprimer</span>
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
