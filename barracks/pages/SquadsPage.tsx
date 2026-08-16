import React from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad } from "../types";
import { SquadCard } from "../components/SquadCard";
import { PlusIcon } from "../components/Icons";

interface SquadsPageProps {
  squads: Squad[];
  onDeleteSquad: (squadId: string) => void;
}

export const SquadsPage: React.FC<SquadsPageProps> = ({ squads, onDeleteSquad }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (squads.length === 0) {
    return (
      <div className="empty">
        <div className="empty__slots">
          <div className="empty__slot" />
          <div className="empty__slot" />
          <div className="empty__slot" />
        </div>
        <div className="stack stack--2">
          <div className="empty__title">{t("squads.emptyTitle")}</div>
          <div className="empty__text">{t("squads.emptyText")}</div>
        </div>
        <div className="empty__actions">
          <Link to="/squads/new" className="btn btn--primary">
            <PlusIcon />
            {t("squads.newSquad")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">{t("squads.title")}</h1>
        <span className="page__count num">{squads.length}</span>
        <div className="spacer" />
        <Link to="/squads/new" className="btn btn--primary btn--sm">
          <PlusIcon />
          {t("squads.newSquad")}
        </Link>
      </div>

      <div className="squad-grid">
        {squads.map((squad) => (
          <SquadCard
            key={squad.id}
            squad={squad}
            onEdit={() => navigate(`/squads/${squad.id}/edit`)}
            onDelete={() => {
              if (confirm(t("squads.confirmDelete", { name: squad.name }))) {
                onDeleteSquad(squad.id);
              }
            }}
          />
        ))}
      </div>
    </>
  );
};
