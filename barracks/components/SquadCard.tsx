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
  const cardStyle: React.CSSProperties = {
    border: "2px solid #333",
    borderRadius: "10px",
    padding: "1rem",
    background:
      "linear-gradient(340deg, rgba(255, 247, 217, 1) 0%, rgba(247, 247, 247, 1) 100%)",

    width: "300px",
    height: "420px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#333",
    margin: 0,
  };

  const unitCountStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "#6c757d",
    fontStyle: "italic",
  };

  const buttonGroupStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "flex",
    gap: "0.5rem",
    opacity: 0,
    transition: "opacity 0.2s",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    fontSize: "0.8rem",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
  };

  const editButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "white",
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
    color: "white",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        const buttons = e.currentTarget.querySelector(
          ".squad-buttons"
        ) as HTMLElement;
        if (buttons) buttons.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const buttons = e.currentTarget.querySelector(
          ".squad-buttons"
        ) as HTMLElement;
        if (buttons) buttons.style.opacity = "0";
      }}
    >
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{squad.name}</h3>
          <p style={unitCountStyle}>
            {squad.units.length}/{Barracks.MaxSquadSize} unités
          </p>
        </div>
      </div>

      <ul style={{ color: "#333" }}>
        {squad.units.map((unit, index) => (
          <li>{unit.name}</li>
        ))}
      </ul>

      {(onEdit || onDelete) && (
        <div className="squad-buttons" style={buttonGroupStyle}>
          {onEdit && (
            <button onClick={onEdit} style={editButtonStyle} title="Edit squad">
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              style={deleteButtonStyle}
              title="Delete squad"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
};
