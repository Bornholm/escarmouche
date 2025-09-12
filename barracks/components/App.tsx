import React, { useState } from "react";
import "@picocss/pico";
import { Card } from "./Card";
import { UnitEditor } from "./UnitEditor";
import { Unit } from "./types";

export const App: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([
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
  ]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

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

  const cardOverlayVisibleStyle: React.CSSProperties = {
    ...cardOverlayStyle,
    opacity: 1,
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
      <div style={headerStyle}>
        <h1>La Caserne</h1>
        <button onClick={handleCreateUnit} style={buttonStyle}>
          Create New Unit
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

      <UnitEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveUnit}
        unit={editingUnit}
      />
    </main>
  );
};
