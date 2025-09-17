import React, { useEffect, useState } from "react";
import "@picocss/pico";
import { Card } from "./Card";
import { UnitEditor } from "./UnitEditor";
import { SquadEditor } from "./SquadEditor";
import { SquadCard } from "./SquadCard";
import { Unit, Squad } from "../types";
import { loadUnits, saveUnits, loadSquads, saveSquads } from "./storage";

const defaultUnits = [
  {
    id: "knight",
    name: "Knight Templar",
    health: 3,
    reach: 1,
    move: 1,
    attack: 1,
    imageUrl: "templar_knight.png",
  },
  {
    id: "archer",
    name: "Elven Archer",
    health: 2,
    reach: 3,
    move: 3,
    attack: 1,
    imageUrl: "elven_archer.png",
  },
  {
    id: "mage",
    name: "Fire Mage",
    health: 1,
    reach: 3,
    move: 2,
    attack: 3,
    imageUrl: "fire_mage.png",
  },
];

export const App: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);

  useEffect(() => {
    let units = loadUnits();
    if (units.length === 0) {
      units = [...defaultUnits];
    }
    setUnits(units);
  }, []);

  useEffect(() => {
    const squads = loadSquads();
    setSquads(squads);
  }, []);

  useEffect(() => {
    saveUnits(units);
  }, [units]);

  useEffect(() => {
    saveSquads(squads);
  }, [squads]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isSquadEditorOpen, setIsSquadEditorOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);

  const handleCreateUnit = () => {
    setEditingUnit(null);
    setIsEditorOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsEditorOpen(true);
  };

  const handleSaveUnit = (unit: Unit) => {
    if (editingUnit) {
      // Update existing unit
      setUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
    } else {
      // Add new unit
      setUnits((prev) => [...prev, unit]);
    }
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    // Also remove the unit from any squads
    setSquads((prev) =>
      prev.map((squad) => ({
        ...squad,
        units: squad.units.filter((u) => u.id !== unitId),
      }))
    );
  };

  const handleCreateSquad = () => {
    setEditingSquad(null);
    setIsSquadEditorOpen(true);
  };

  const handleEditSquad = (squad: Squad) => {
    setEditingSquad(squad);
    setIsSquadEditorOpen(true);
  };

  const handleSaveSquad = (squad: Squad) => {
    if (editingSquad) {
      // Update existing squad
      setSquads((prev) => prev.map((s) => (s.id === squad.id ? squad : s)));
    } else {
      // Add new squad
      setSquads((prev) => [...prev, squad]);
    }
  };

  const handleDeleteSquad = (squadId: string) => {
    setSquads((prev) => prev.filter((s) => s.id !== squadId));
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  };

  const cardContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const cardOverlayStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "flex",
    gap: "0.5rem",
    opacity: 0,
    transition: "opacity 0.2s",
  };

  const smallButtonStyle: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    fontSize: "0.8rem",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
  };

  const editButtonStyle: React.CSSProperties = {
    ...smallButtonStyle,
    backgroundColor: "#28a745",
    color: "white",
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...smallButtonStyle,
    backgroundColor: "#dc3545",
    color: "white",
  };

  return (
    <main className="container-fluid" style={{ padding: "1rem" }}>
      <h1>La Caserne</h1>

      <div className="grid">
        <div>
          <div style={headerStyle}>
            <h2>Escouades</h2>
            <button onClick={handleCreateSquad} style={buttonStyle}>
              Nouvelle escouade
            </button>
          </div>
          <div
            className="grid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "start",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {squads.length === 0 ? (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                Aucune escouade créée. Cliquez sur "Nouvelle escouade" pour
                commencer.
              </p>
            ) : (
              squads.map((squad) => (
                <SquadCard
                  key={squad.id}
                  squad={squad}
                  onEdit={() => handleEditSquad(squad)}
                  onDelete={() => handleDeleteSquad(squad.id)}
                />
              ))
            )}
          </div>
        </div>
        <div>
          <div style={headerStyle}>
            <h2>Unités</h2>
            <button onClick={handleCreateUnit} style={buttonStyle}>
              Nouvelle unité
            </button>
          </div>
          <div
            className="grid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "start",
              gap: "1rem",
            }}
          >
            {units.map((unit) => (
              <div
                key={unit.id}
                style={cardContainerStyle}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector(
                    ".card-overlay"
                  ) as HTMLElement;
                  if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector(
                    ".card-overlay"
                  ) as HTMLElement;
                  if (overlay) overlay.style.opacity = "0";
                }}
              >
                <Card unit={unit} />
                <div className="card-overlay" style={cardOverlayStyle}>
                  <button
                    onClick={() => handleEditUnit(unit)}
                    style={editButtonStyle}
                    title="Edit unit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    style={deleteButtonStyle}
                    title="Delete unit"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UnitEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveUnit}
        unit={editingUnit}
      />

      <SquadEditor
        isOpen={isSquadEditorOpen}
        onClose={() => setIsSquadEditorOpen(false)}
        onSave={handleSaveSquad}
        squad={editingSquad}
        availableUnits={units}
      />
    </main>
  );
};
