import React from "react";
import { Squad } from "../types";

interface SquadCardProps {
  squad: Squad;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SquadCard: React.FC<SquadCardProps> = ({
  squad,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className="box"
      style={{
        background:
          "linear-gradient(340deg, rgba(255, 247, 217, 1) 0%, rgba(247, 247, 247, 1) 100%)",
        border: "2px solid #333",
        borderRadius: "10px",
        width: "300px",
        height: "420px",
        position: "relative",
      }}
    >
      <div className="content">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <div className="level-item">
              <div>
                <h3 className="title is-5 has-text-dark mb-1">{squad.name}</h3>
                <p className="subtitle is-6 has-text-grey is-italic">
                  {squad.units.length}/{Barracks.MaxSquadSize} unités
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="content has-text-dark">
          {squad.units.length === 0 ? (
            <p className="has-text-grey is-italic">
              Aucune unité dans cette escouade
            </p>
          ) : (
            <ul>
              {squad.units.map((unit, index) => (
                <li key={index} className="is-size-7">
                  {unit.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div
          className="squad-buttons"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0";
          }}
        >
          <div className="buttons are-small">
            {onEdit && (
              <button
                onClick={onEdit}
                className="button is-success is-small"
                title="Modifier l'escouade"
              >
                <span className="icon is-small">
                  <i className="fas fa-edit"></i>
                </span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="button is-danger is-small"
                title="Supprimer l'escouade"
              >
                <span className="icon is-small">
                  <i className="fas fa-trash"></i>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
