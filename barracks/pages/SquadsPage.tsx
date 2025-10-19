import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad } from "../types";
import { SquadCard } from "../components/SquadCard";

interface SquadsPageProps {
  squads: Squad[];
  onDeleteSquad: (squadId: string) => void;
}

export const SquadsPage: React.FC<SquadsPageProps> = ({
  squads,
  onDeleteSquad,
}) => {
  const { t } = useTranslation();
  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">{t("squads.title")}</h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <Link to="/squads/new" className="button">
                <span className="icon">
                  <i className="fas fa-plus"></i>
                </span>
                <span>{t("squads.newSquad")}</span>
              </Link>
            </div>
          </div>
        </div>

        {squads.length === 0 ? (
          <div className="notification">
            <p className="has-text-centered">{t("squads.noSquads")}</p>
          </div>
        ) : (
          <div className="columns is-multiline is-mobile">
            {squads.map((squad) => (
              <div
                key={squad.id}
                className="column is-12-mobile is-6-tablet is-4-desktop"
              >
                <div className="card">
                  <div className="card-content is-flex is-justify-content-center">
                    <SquadCard
                      squad={squad}
                      onEdit={() => {}}
                      onDelete={() => onDeleteSquad(squad.id)}
                    />
                  </div>
                  <footer className="card-footer">
                    <Link
                      to={`/squads/${squad.id}/edit`}
                      className="card-footer-item button is-ghost"
                    >
                      <span className="icon">
                        <i className="fas fa-edit"></i>
                      </span>
                      <span>{t("squads.edit")}</span>
                    </Link>
                    <button
                      onClick={() => onDeleteSquad(squad.id)}
                      className="card-footer-item button is-ghost has-text-danger"
                    >
                      <span className="icon">
                        <i className="fas fa-trash"></i>
                      </span>
                      <span>{t("squads.delete")}</span>
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
