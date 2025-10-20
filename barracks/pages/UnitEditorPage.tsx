import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Unit, Rank, Archetype, GeneratedUnit, Ability } from "../types";
import { Card } from "../components/Card";
import { generateId } from "../util/storage";
import {
  fileToBase64,
  validateImageFile,
  resizeImage,
} from "../components/imageUtils";
import { BASE_URL } from "../util/baseUrl";
import { useAsyncMemo } from "../hooks/useAsyncMemo";
import { IgnoreTrans } from "../components/IgnoreTrans";
import { fork } from "child_process";
import { normalizeLocale } from "../util/locale";

interface UnitEditorPageProps {
  units: Unit[];
  onSave: (unit: Unit) => void;
}

export const UnitEditorPage: React.FC<UnitEditorPageProps> = ({
  units,
  onSave,
}) => {
  const { t, i18n } = useTranslation();
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

  const availableAbilities = useAsyncMemo(() => {
    return Barracks.getAvailableAbilities(normalizeLocale(i18n.language));
  }, [i18n.language]);

  const evaluation = useAsyncMemo(
    () => Barracks.evaluateUnit(formData),
    [formData]
  );

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

  const handleAbilityChange = (
    abilityIndex: number,
    value: string | undefined | null
  ) => {
    setFormData((prev) => {
      const abilities = [...prev.abilities];
      if (!value || value === "--") {
        abilities.splice(abilityIndex, 1);
      } else {
        const ability: Ability | undefined = availableAbilities?.find(
          (a) => a.id === value
        );
        if (ability) {
          abilities[abilityIndex] = ability.id;
        }
      }
      return {
        ...prev,
        abilities,
      };
    });
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
        return `${BASE_URL}/templar_knight.png`;
      case Archetype.Bruiser:
        return `${BASE_URL}/orc_warrior.png`;
      case Archetype.Sniper:
        return `${BASE_URL}/elven_archer.png`;
      case Archetype.Skirmisher:
        return `${BASE_URL}/orc_javelin.png`;
      case Archetype.GlassCannon:
        return `${BASE_URL}/fire_mage.png`;
      default:
        return `${BASE_URL}/templar_knight.png`;
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

  const isUnitValid = (evaluation?.cost ?? 0) <= Barracks.MaxUnitCost;

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">
                {isEditing
                  ? t("unitEditor.editUnit")
                  : t("unitEditor.createUnit")}
              </h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <button onClick={handleCancel} className="button">
                <span className="icon">
                  <i className="fas fa-arrow-left"></i>
                </span>
                <span>{t("unitEditor.back")}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="columns">
          <div className="column is-8">
            <form onSubmit={handleSubmit}>
              {/* Random Unit Generation Section */}
              <div className="box">
                <h2 className="subtitle">{t("unitEditor.randomGeneration")}</h2>
                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">{t("unitEditor.rank")}</label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            value={selectedRank}
                            onChange={(e) =>
                              setSelectedRank(e.target.value as Rank)
                            }
                          >
                            <option value={Rank.Trooper}>
                              {t("ranks.trooper")}
                            </option>
                            <option value={Rank.Veteran}>
                              {t("ranks.veteran")}
                            </option>
                            <option value={Rank.Elite}>
                              {t("ranks.elite")}
                            </option>
                            <option value={Rank.Champion}>
                              {t("ranks.champion")}
                            </option>
                            <option value={Rank.Paragon}>
                              {t("ranks.paragon")}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">
                        {t("unitEditor.archetype")}
                      </label>
                      <div className="control">
                        <div className="select is-fullwidth">
                          <select
                            value={selectedArchetype}
                            onChange={(e) =>
                              setSelectedArchetype(e.target.value as Archetype)
                            }
                          >
                            <option value={Archetype.JackOfAllTrades}>
                              {t("archetypes.jackofalltrades")}
                            </option>
                            <option value={Archetype.Tank}>
                              {t("archetypes.tank")}
                            </option>
                            <option value={Archetype.Sniper}>
                              {t("archetypes.sniper")}
                            </option>
                            <option value={Archetype.Skirmisher}>
                              {t("archetypes.skirmisher")}
                            </option>
                            <option value={Archetype.Bruiser}>
                              {t("archetypes.bruiser")}
                            </option>
                            <option value={Archetype.GlassCannon}>
                              {t("archetypes.glasscannon")}
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
                        ? t("unitEditor.generating")
                        : t("unitEditor.generateRandomUnit")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Unit Details */}
              <div className="box">
                <h2 className="subtitle">{t("unitEditor.unitDetails")}</h2>

                <div className="field">
                  <label className="label">{t("unitEditor.name")}</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder={t("unitEditor.unitNamePlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">{t("unitEditor.health")}</label>
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
                      <label className="label">{t("unitEditor.move")}</label>
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
                      <label className="label">{t("unitEditor.range")}</label>
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
                      <label className="label">{t("unitEditor.power")}</label>
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

              {/* Unit abilities */}
              <div className="box">
                <h2 className="subtitle">{t("unitEditor.abilities")}</h2>
                <div className="field">
                  <label className="label">{t("unitEditor.primary")}</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        className="select"
                        onChange={(e) => handleAbilityChange(0, e.target.value)}
                        value={formData.abilities[0]}
                      >
                        <option value={undefined}>
                          <IgnoreTrans>--</IgnoreTrans>
                        </option>
                        {availableAbilities
                          ?.filter((a) => a.id !== formData.abilities[1])
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              <IgnoreTrans>
                                {a.label} ({a.cost})
                              </IgnoreTrans>
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">{t("unitEditor.secondary")}</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        className="select"
                        onChange={(e) => handleAbilityChange(1, e.target.value)}
                        value={formData.abilities[1]}
                      >
                        <option value={undefined}>
                          <IgnoreTrans>--</IgnoreTrans>
                        </option>
                        {availableAbilities
                          ?.filter((a) => a.id !== formData.abilities[0])
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              <IgnoreTrans>
                                {a.label} ({a.cost})
                              </IgnoreTrans>
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="box">
                <h2 className="subtitle">{t("unitEditor.illustration")}</h2>

                {formData.imageUrl && formData.imageUrl.startsWith("data:") ? (
                  <div className="notification">
                    <div className="level">
                      <div className="level-left">
                        <div className="level-item">
                          <span>{t("unitEditor.customImageUploaded")}</span>
                        </div>
                      </div>
                      <div className="level-right">
                        <div className="level-item">
                          <button
                            type="button"
                            onClick={handleRemoveCustomImage}
                            className="button is-small is-danger"
                          >
                            {t("unitEditor.delete")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label className="label">
                        {t("unitEditor.uploadCustomImage")}
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
                          {t("unitEditor.uploading")}
                        </p>
                      )}
                      {uploadError && (
                        <p className="help is-danger">{uploadError}</p>
                      )}
                      <p className="help">{t("unitEditor.supportedFormats")}</p>
                    </div>

                    <div className="field">
                      <label className="label">
                        {t("unitEditor.orChoosePredefined")}
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
                              {t("predefinedUnits.templarKnight")}
                            </option>
                            <option value={`${BASE_URL}/elven_archer.png`}>
                              {t("predefinedUnits.elvenArcher")}
                            </option>
                            <option value={`${BASE_URL}/fire_mage.png`}>
                              {t("predefinedUnits.fireMage")}
                            </option>
                            <option value={`${BASE_URL}/orc_javelin.png`}>
                              {t("predefinedUnits.orcSkirmisher")}
                            </option>
                            <option value={`${BASE_URL}/orc_shaman.png`}>
                              {t("predefinedUnits.orcShaman")}
                            </option>
                            <option value={`${BASE_URL}/orc_warrior.png`}>
                              {t("predefinedUnits.orcWarrior")}
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
              <h2 className="subtitle">{t("unitEditor.preview")}</h2>
              <div className="is-flex is-justify-content-center pb-5">
                <Card unit={formData} />
              </div>
            </div>

            <div className="box">
              <h2 className="subtitle">{t("unitEditor.evaluation")}</h2>
              <div className="field">
                <label className="label">{t("unitEditor.unitPoints")}</label>
                <div className="control">
                  <p className="input is-static">
                    <span
                      className={`${
                        !isUnitValid ? "has-text-danger" : "has-text-success"
                      }`}
                    >
                      {evaluation?.cost} / {Barracks.MaxUnitCost}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="buttons is-centered are-medium">
              <button
                type="button"
                onClick={handleCancel}
                className="button is-warning"
              >
                {t("unitEditor.cancel")}
              </button>
              <button
                type="submit"
                className="button is-primary"
                disabled={!isUnitValid}
                onClick={handleSubmit}
              >
                {isEditing ? t("unitEditor.save") : t("unitEditor.create")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
