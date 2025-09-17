import React, { useState, useEffect, useMemo } from "react";
import { Squad, Unit } from "../types";
import { Card } from "./Card";
import { generateId } from "./storage";
import { useAsyncMemo } from "../hooks/useAsyncMemo";

interface SquadEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (squad: Squad) => void;
  squad?: Squad | null;
  availableUnits: Unit[];
}

const gridStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "start",
  gap: "1em",
};

export const SquadEditor: React.FC<SquadEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  squad,
  availableUnits,
}) => {
  const [formData, setFormData] = useState<Squad>({
    id: "",
    name: "",
    units: [],
  });

  const evaluations = useAsyncMemo(() => {
    return Promise.all(formData.units.map((u) => Barracks.evaluateUnit(u)));
  }, [formData.units]);

  const totalRankPoints = useMemo(
    () =>
      evaluations?.reduce(
        (total, evaluation) => total + Barracks.RankPointCosts[evaluation.rank],
        0
      ) ?? 0,
    [evaluations]
  );

  const composition = useMemo(
    () =>
      evaluations?.reduce((composition, evaluation) => {
        if (!composition[evaluation.rank]) {
          composition[evaluation.rank] = 0;
        }
        composition[evaluation.rank] += 1;
        return composition;
      }, {} as { [rank: string]: number }) ?? {},
    [evaluations]
  );

  // Initialize form data when squad prop changes
  useEffect(() => {
    if (squad) {
      setFormData({ ...squad });
    } else {
      setFormData({
        id: generateId(),
        name: "",
        units: [],
      });
    }
  }, [squad, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleAddUnit = (unit: Unit) => {
    if (formData.units.length < 6) {
      setFormData((prev) => ({
        ...prev,
        units: [...prev.units, { ...unit, id: generateId() }],
      }));
    }
  };

  const handleRemoveUnit = (unitId: string) => {
    setFormData((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== unitId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const sectionStyle: React.CSSProperties = {
    marginBottom: "2rem",
  };

  const unitCardStyle: React.CSSProperties = {
    position: "relative",
    cursor: "pointer",
    width: "150px",
    height: "210px",
  };

  const squadUnitCardStyle: React.CSSProperties = {
    position: "relative",
    width: "150px",
    height: "210px",
  };

  const removeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "5px",
    right: "6px",
    cursor: "pointer",
    fontSize: "21px",
    fontWeight: "bold",
    color: "#333",
    textShadow: "1px 1px #ccc",
    lineHeight: "15px",
  };

  const isValid =
    formData.units.length <= Barracks.MaxSquadSize &&
    totalRankPoints <= Barracks.MaxSquadRankPoints;

  return (
    <dialog open>
      <article style={{ maxWidth: "80%" }}>
        <header>
          <button aria-label="Close" rel="prev" onClick={handleCancel}></button>
          <p>
            <strong>
              {squad ? "Modifier l'escouade" : "Créer une nouvelle escouade"}
            </strong>
          </p>
        </header>

        <section>
          <div className="grid">
            <div style={sectionStyle}>
              <label>
                <strong>Nom de l'escouade</strong>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Mon escouade..."
                required
              />
            </div>
            <div style={sectionStyle}>
              <ul>
                <li>
                  <strong
                    style={{
                      color:
                        totalRankPoints > Barracks.MaxSquadRankPoints
                          ? "red"
                          : "inherit",
                    }}
                  >
                    Points de rang: {totalRankPoints}/
                    {Barracks.MaxSquadRankPoints}
                  </strong>
                </li>
                <li>
                  <strong>
                    Composition: {formData?.units.length}/
                    {Barracks.MaxSquadSize}
                  </strong>
                  <ul>
                    {Object.keys(composition).map((rank) => (
                      <li>
                        {rank}: {composition[rank]}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3>Escouade</h3>
          <div style={gridStyle}>
            {formData.units.length === 0 ? (
              <p style={{ color: "#6c757d", margin: 0 }}>
                Cliquer sur les unités ci-dessous pour les ajouter à votre
                escouade
              </p>
            ) : (
              formData.units.map((unit) => (
                <div key={unit.id} style={squadUnitCardStyle}>
                  <Card
                    unit={unit}
                    style={{
                      transform: "scale(0.5)",
                      transformOrigin: "top left",
                    }}
                  />
                  <div
                    onClick={() => handleRemoveUnit(unit.id)}
                    style={removeButtonStyle}
                    title="Retirer"
                  >
                    ×
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h3>Unités disponibles</h3>
          <div style={gridStyle}>
            {availableUnits.map((unit) => (
              <div
                key={unit.id}
                style={{
                  ...unitCardStyle,
                  pointerEvents:
                    formData.units.length >= Barracks.MaxSquadSize
                      ? "none"
                      : "auto",
                  opacity:
                    formData.units.length >= Barracks.MaxSquadSize ? 0.5 : 1,
                }}
                onClick={() => handleAddUnit(unit)}
                title={
                  formData.units.length >= Barracks.MaxSquadSize
                    ? "Escouade complète"
                    : "Cliquer pour ajouter"
                }
              >
                <Card
                  unit={unit}
                  style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
        <footer>
          <button onClick={handleCancel} className="secondary">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!isValid}>
            {squad ? "Mettre à jour" : "Créer"}
          </button>
        </footer>
      </article>
    </dialog>
  );
};
