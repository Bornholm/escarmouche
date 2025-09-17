import React, { useState, useEffect } from "react";
import { Unit, Rank, Archetype, GeneratedUnit } from "../types";
import { Card } from "./Card";
import { generateId } from "./storage";

interface UnitEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Unit) => void;
  unit?: Unit | null;
}

export const UnitEditor: React.FC<UnitEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  unit,
}) => {
  const [formData, setFormData] = useState<Unit>({
    id: "",
    name: "",
    health: 1,
    move: 1,
    reach: 1,
    attack: 1,
    imageUrl: "templar_knight.png",
  });

  const [selectedRank, setSelectedRank] = useState<Rank>(Rank.Trooper);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(
    Archetype.Balanced
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize form data when unit prop changes
  useEffect(() => {
    if (unit) {
      setFormData({ ...unit });
    } else {
      setFormData({
        id: generateId(),
        name: "",
        health: 1,
        move: 1,
        reach: 1,
        attack: 1,
        imageUrl: "templar_knight.png",
      });
    }
  }, [unit, isOpen]);

  const handleInputChange = (field: keyof Unit, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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

  const handleGenerateRandomUnit = async () => {
    setIsGenerating(true);
    try {
      const generatedUnit: GeneratedUnit = await Barracks.generateUnit(
        selectedRank,
        selectedArchetype
      );

      // Convert GeneratedUnit to Unit format
      const newUnit: Unit = {
        id: formData.id || generateId(),
        name: `${generatedUnit.rank} ${generatedUnit.archetype}`.replace(
          /^\w/,
          (c) => c.toUpperCase()
        ),
        health: generatedUnit.health,
        move: generatedUnit.move,
        reach: generatedUnit.reach,
        attack: generatedUnit.attack,
        imageUrl: getImageForArchetype(generatedUnit.archetype),
      };

      setFormData(newUnit);
    } catch (error) {
      console.error("Failed to generate unit:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getImageForArchetype = (archetype: Archetype): string => {
    switch (archetype) {
      case Archetype.Tank:
      case Archetype.Bruiser:
        return "templar_knight.png";
      case Archetype.Sniper:
      case Archetype.Skirmisher:
        return "elven_archer.png";
      case Archetype.GlassCannon:
        return "fire_mage.png";
      default:
        return "templar_knight.png";
    }
  };

  if (!isOpen) return null;

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "2rem",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  const sideBySideStyle: React.CSSProperties = {
    display: "flex",
    gap: "2rem",
    alignItems: "flex-start",
  };

  const formSectionStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "300px",
  };

  const cardSectionStyle: React.CSSProperties = {
    flex: "0 0 auto",
  };

  return (
    <dialog open>
      <article>
        <header>
          <button aria-label="Close" rel="prev" onClick={handleCancel}></button>
          <p>
            <strong>
              {unit ? "Modifier l'unité" : "Créer une nouvelle unité"}
            </strong>
          </p>
        </header>
        <div style={sideBySideStyle}>
          <div style={formSectionStyle}>
            {/* Random Unit Generation Section */}
            <fieldset>
              <legend>Génération aléatoire</legend>
              <div className="grid">
                <div>
                  <label>Rang:</label>
                  <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value as Rank)}
                  >
                    <option value={Rank.Trooper}>Trooper</option>
                    <option value={Rank.Veteran}>Veteran</option>
                    <option value={Rank.Elite}>Elite</option>
                    <option value={Rank.Champion}>Champion</option>
                    <option value={Rank.Paragon}>Paragon</option>
                  </select>
                </div>
                <div>
                  <label>Archétype:</label>
                  <select
                    value={selectedArchetype}
                    onChange={(e) =>
                      setSelectedArchetype(e.target.value as Archetype)
                    }
                  >
                    <option value={Archetype.Balanced}>Balanced</option>
                    <option value={Archetype.Tank}>Tank</option>
                    <option value={Archetype.Sniper}>Sniper</option>
                    <option value={Archetype.Skirmisher}>Skirmisher</option>
                    <option value={Archetype.Bruiser}>Bruiser</option>
                    <option value={Archetype.GlassCannon}>Glass Cannon</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="outline"
                onClick={handleGenerateRandomUnit}
                disabled={isGenerating}
                aria-busy={isGenerating}
              >
                {isGenerating ? "Génération..." : "Générer une unité aléatoire"}
              </button>
            </fieldset>

            <div>
              <label>Nom:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter unit name"
                required
              />
            </div>

            <div>
              <label>Health:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.health}
                onChange={(e) =>
                  handleInputChange("health", parseInt(e.target.value) || 1)
                }
                required
              />
            </div>

            <div>
              <label>Move:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.move}
                onChange={(e) =>
                  handleInputChange("move", parseInt(e.target.value) || 1)
                }
                required
              />
            </div>

            <div>
              <label>Reach:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.reach}
                onChange={(e) =>
                  handleInputChange("reach", parseInt(e.target.value) || 1)
                }
                required
              />
            </div>

            <div>
              <label>Attack:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.attack}
                onChange={(e) =>
                  handleInputChange("attack", parseInt(e.target.value) || 1)
                }
                required
              />
            </div>

            <div>
              <label>Illustration:</label>
              <select
                value={formData.imageUrl || "templar_knight.png"}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
              >
                <option value="templar_knight.png">Templar Knight</option>
                <option value="elven_archer.png">Elven Archer</option>
                <option value="fire_mage.png">Fire Mage</option>
              </select>
            </div>
          </div>

          <div style={cardSectionStyle}>
            <h3>Prévisualisation:</h3>
            <Card unit={formData} />
          </div>
        </div>
        <footer>
          <button className="secondary" onClick={handleCancel}>
            Annuler
          </button>
          <button onClick={handleSubmit}>{unit ? "Modifier" : "Créer"}</button>
        </footer>
      </article>
    </dialog>
  );
};
