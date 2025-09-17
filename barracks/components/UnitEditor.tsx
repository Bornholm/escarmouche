import React, { useState, useEffect, useRef } from "react";
import { Unit, Rank, Archetype, GeneratedUnit } from "../types";
import { Card } from "./Card";
import { generateId } from "./storage";
import { fileToBase64, validateImageFile, resizeImage } from "./imageUtils";

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
    customImage: undefined,
  });

  const [selectedRank, setSelectedRank] = useState<Rank>(Rank.Trooper);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(
    Archetype.Balanced
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        customImage: undefined,
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
        customImage: undefined,
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      // Validate the file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || "Fichier invalide");
        return;
      }

      // Convert to base64
      const base64 = await fileToBase64(file);

      // Resize the image to optimize storage
      const resizedBase64 = await resizeImage(base64, 400, 400);

      // Update form data with custom image
      setFormData((prev) => ({
        ...prev,
        customImage: resizedBase64,
        imageUrl: undefined, // Clear the preset image when using custom
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError("Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCustomImage = () => {
    setFormData((prev) => ({
      ...prev,
      customImage: undefined,
      imageUrl: "templar_knight.png", // Reset to default
    }));
    setUploadError(null);
  };

  const handlePresetImageChange = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl,
      customImage: undefined, // Clear custom image when selecting preset
    }));
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

              {/* Custom Image Upload Section */}
              {formData.customImage ? (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <span style={{ color: "#28a745", fontSize: "0.9rem" }}>
                      ✓ Image personnalisée téléchargée
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCustomImage}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.8rem",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* File Upload */}
                  <div style={{ marginBottom: "1rem" }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      style={{ marginBottom: "0.5rem" }}
                    />
                    {isUploadingImage && (
                      <div style={{ color: "#007bff", fontSize: "0.9rem" }}>
                        Téléchargement en cours...
                      </div>
                    )}
                    {uploadError && (
                      <div style={{ color: "#dc3545", fontSize: "0.9rem" }}>
                        {uploadError}
                      </div>
                    )}
                    <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                      Formats supportés: JPG, PNG, GIF, WebP (max 5MB)
                    </div>
                  </div>

                  {/* Preset Images */}
                  <div>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Ou choisir une illustration prédéfinie:
                    </label>
                    <select
                      value={formData.imageUrl || "templar_knight.png"}
                      onChange={(e) => handlePresetImageChange(e.target.value)}
                    >
                      <option value="templar_knight.png">Templar Knight</option>
                      <option value="elven_archer.png">Elven Archer</option>
                      <option value="fire_mage.png">Fire Mage</option>
                    </select>
                  </div>
                </>
              )}
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
