import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Unit, Rank, Archetype, GeneratedUnit } from "../types";
import { Card } from "../components/Card";
import { generateId } from "../util/storage";
import {
  fileToBase64,
  validateImageFile,
  resizeImage,
} from "../components/imageUtils";
import { BASE_URL } from "../util/baseUrl";
import { useAsyncMemo } from "../hooks/useAsyncMemo";

interface UnitEditorPageProps {
  units: Unit[];
  onSave: (unit: Unit) => void;
}

export const UnitEditorPage: React.FC<UnitEditorPageProps> = ({
  units,
  onSave,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== "new";
  const existingUnit = isEditing ? units.find((u) => u.id === id) : null;

  const [formData, setFormData] = useState<Unit>({
    id: "",
    name: "",
    health: 1,
    move: 1,
    range: 1,
    power: 1,
    imageUrl: `${BASE_URL}/templar_knight.png`,
    abilities: [],
  });

  const [selectedRank, setSelectedRank] = useState<Rank>(Rank.Trooper);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(
    Archetype.JackOfAllTrades
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingUnit) {
      setFormData({ ...existingUnit });
    } else {
      setFormData({
        id: generateId(),
        name: "",
        health: 1,
        move: 1,
        range: 1,
        power: 1,
        imageUrl: `${BASE_URL}/templar_knight.png`,
        abilities: [],
      });
    }
  }, [existingUnit]);

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
      navigate("/units");
    }
  };

  const handleCancel = () => {
    navigate("/units");
  };

  const handleGenerateRandomUnit = async () => {
    setIsGenerating(true);
    try {
      const generatedUnit: GeneratedUnit = await Barracks.generateUnit(
        selectedRank,
        selectedArchetype
      );

      const newUnit: Unit = {
        id: formData.id || generateId(),
        name: `${generatedUnit.rank} ${generatedUnit.archetype}`.replace(
          /^\w/,
          (c) => c.toUpperCase()
        ),
        health: generatedUnit.health,
        move: generatedUnit.move,
        range: generatedUnit.range,
        power: generatedUnit.power,
        imageUrl: getImageForArchetype(generatedUnit.archetype),
        abilities: generatedUnit.abilities,
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
        return "/templar_knight.png";
      case Archetype.Bruiser:
        return "/orc_warrior.png";
      case Archetype.Sniper:
        return "/elven_archer.png";
      case Archetype.Skirmisher:
        return "/orc_javelin.png";
      case Archetype.GlassCannon:
        return "/fire_mage.png";
      default:
        return "/templar_knight.png";
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
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || "Fichier invalide");
        return;
      }

      const base64 = await fileToBase64(file);
      const resizedBase64 = await resizeImage(base64, 400, 400);

      setFormData((prev) => ({
        ...prev,
        imageUrl: resizedBase64,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError("Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCustomImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: `${BASE_URL}/templar_knight.png`,
    }));
    setUploadError(null);
  };

  const handlePresetImageChange = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl,
    }));
  };

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">
                {isEditing ? "Modifier l'unité" : "Créer une nouvelle unité"}
              </h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <button onClick={handleCancel} className="button">
                <span className="icon">
                  <i className="fas fa-arrow-left"></i>
                </span>
                <span>Retour</span>
              </button>
            </div>
          </div>
        </div>

        <div className="columns">
          <div className="column is-8">
            <form onSubmit={handleSubmit}>
              {/* Random Unit Generation Section */}
              <div className="box">
                <h2 className="subtitle">Génération aléatoire</h2>
                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">Rang:</label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            value={selectedRank}
                            onChange={(e) =>
                              setSelectedRank(e.target.value as Rank)
                            }
                          >
                            <option value={Rank.Trooper}>Trooper</option>
                            <option value={Rank.Veteran}>Veteran</option>
                            <option value={Rank.Elite}>Elite</option>
                            <option value={Rank.Champion}>Champion</option>
                            <option value={Rank.Paragon}>Paragon</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Archétype:</label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            value={selectedArchetype}
                            onChange={(e) =>
                              setSelectedArchetype(e.target.value as Archetype)
                            }
                          >
                            <option value={Archetype.JackOfAllTrades}>
                              Jack of all trades
                            </option>
                            <option value={Archetype.Tank}>Tank</option>
                            <option value={Archetype.Sniper}>Sniper</option>
                            <option value={Archetype.Skirmisher}>
                              Skirmisher
                            </option>
                            <option value={Archetype.Bruiser}>Bruiser</option>
                            <option value={Archetype.GlassCannon}>
                              Glass Cannon
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button
                      type="button"
                      className={`button is-info ${
                        isGenerating ? "is-loading" : ""
                      }`}
                      onClick={handleGenerateRandomUnit}
                      disabled={isGenerating}
                    >
                      {isGenerating
                        ? "Génération..."
                        : "Générer une unité aléatoire"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Unit Details */}
              <div className="box">
                <h2 className="subtitle">Détails de l'unité</h2>

                <div className="field">
                  <label className="label">Nom:</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nom de l'unité"
                      required
                    />
                  </div>
                </div>

                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">Health:</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.health}
                          onChange={(e) =>
                            handleInputChange(
                              "health",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Move:</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.move}
                          onChange={(e) =>
                            handleInputChange(
                              "move",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Range:</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.range}
                          onChange={(e) =>
                            handleInputChange(
                              "range",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Power:</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.power}
                          onChange={(e) =>
                            handleInputChange(
                              "power",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="box">
                <h2 className="subtitle">Illustration</h2>

                {formData.imageUrl && formData.imageUrl.startsWith("data:") ? (
                  <div className="notification">
                    <div className="level">
                      <div className="level-left">
                        <div className="level-item">
                          <span>✓ Image personnalisée téléchargée</span>
                        </div>
                      </div>
                      <div className="level-right">
                        <div className="level-item">
                          <button
                            type="button"
                            onClick={handleRemoveCustomImage}
                            className="button is-small is-danger"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label className="label">
                        Télécharger une image personnalisée:
                      </label>
                      <div className="control">
                        <input
                          ref={fileInputRef}
                          className="input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                        />
                      </div>
                      {isUploadingImage && (
                        <p className="help is-info">
                          Téléchargement en cours...
                        </p>
                      )}
                      {uploadError && (
                        <p className="help is-danger">{uploadError}</p>
                      )}
                      <p className="help">
                        Formats supportés: JPG, PNG, GIF, WebP (max 5MB)
                      </p>
                    </div>

                    <div className="field">
                      <label className="label">
                        Ou choisir une illustration prédéfinie:
                      </label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            value={
                              formData.imageUrl ||
                              `${BASE_URL}/templar_knight.png`
                            }
                            onChange={(e) =>
                              handlePresetImageChange(e.target.value)
                            }
                          >
                            <option value={`${BASE_URL}/templar_knight.png`}>
                              Templar Knight
                            </option>
                            <option value={`${BASE_URL}/elven_archer.png`}>
                              Elven Archer
                            </option>
                            <option value={`${BASE_URL}/fire_mage.png`}>
                              Fire Mage
                            </option>
                            <option value={`${BASE_URL}/orc_javelin.png`}>
                              Orc Skirmisher
                            </option>
                            <option value={`${BASE_URL}/orc_shaman.png`}>
                              Orc Shaman
                            </option>
                            <option value={`${BASE_URL}/orc_warrior.png`}>
                              Orc Warrior
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>

          <div className="column is-4">
            <div className="box">
              <h2 className="subtitle">Prévisualisation</h2>
              <div className="is-flex is-justify-content-center pb-5">
                <Card unit={formData} />
              </div>
            </div>

            <div className="buttons is-centered are-medium">
              <button
                type="button"
                onClick={handleCancel}
                className="button is-warning"
              >
                Annuler
              </button>
              <button type="submit" className="button is-primary">
                {isEditing ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
