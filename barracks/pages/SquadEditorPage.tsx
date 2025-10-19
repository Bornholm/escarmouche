import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Squad, Unit } from "../types";
import { Card } from "../components/Card";
import { generateId } from "../util/storage";
import { useAsyncMemo } from "../hooks/useAsyncMemo";

interface SquadEditorPageProps {
  squads: Squad[];
  availableUnits: Unit[];
  onSave: (squad: Squad) => void;
}

export const SquadEditorPage: React.FC<SquadEditorPageProps> = ({
  squads,
  availableUnits,
  onSave,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== "new";
  const existingSquad = isEditing ? squads.find((s) => s.id === id) : null;

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

  useEffect(() => {
    if (existingSquad) {
      setFormData({ ...existingSquad });
    } else {
      setFormData({
        id: generateId(),
        name: "",
        units: [],
      });
    }
  }, [existingSquad]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleAddUnit = (unit: Unit) => {
    if (formData.units.length < Barracks.MaxSquadSize) {
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
      navigate("/squads");
    }
  };

  const handleCancel = () => {
    navigate("/squads");
  };

  const isValid =
    formData.units.length <= Barracks.MaxSquadSize &&
    totalRankPoints <= Barracks.MaxSquadRankPoints;

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">
                {isEditing
                  ? t("squadEditor.editSquad")
                  : t("squadEditor.createSquad")}
              </h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <button onClick={handleCancel} className="button">
                <span className="icon">
                  <i className="fas fa-arrow-left"></i>
                </span>
                <span>{t("squadEditor.back")}</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="columns">
            <div className="column is-8">
              {/* Squad Details */}
              <div className="box">
                <h2 className="subtitle">{t("squadEditor.squadDetails")}</h2>
                <div className="field">
                  <label className="label">{t("squadEditor.squadName")}</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={t("squadEditor.squadNamePlaceholder")}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Current Squad */}
              <div className="box">
                <h2 className="subtitle">{t("squadEditor.currentSquad")}</h2>
                {formData.units.length === 0 ? (
                  <div className="notification">
                    <p>{t("squadEditor.clickToAdd")}</p>
                  </div>
                ) : (
                  <div className="columns is-multiline is-mobile">
                    {formData.units.map((unit) => (
                      <div key={unit.id} className="column is-narrow">
                        <div className="card">
                          <div className="card-content is-flex is-justify-content-center p-0">
                            <div
                              style={{
                                transform: "scale(0.7)",
                              }}
                            >
                              <Card unit={unit} />
                            </div>
                          </div>
                          <footer className="card-footer">
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(unit.id)}
                              className="card-footer-item button is-ghost has-text-danger"
                            >
                              <span className="icon">
                                <i className="fas fa-times"></i>
                              </span>
                              <span>{t("squadEditor.remove")}</span>
                            </button>
                          </footer>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Units */}
              <div className="box">
                <h2 className="subtitle">{t("squadEditor.availableUnits")}</h2>
                {availableUnits.length === 0 ? (
                  <div className="notification is-warning">
                    <p>{t("squadEditor.noAvailableUnits")}</p>
                  </div>
                ) : (
                  <div className="columns is-multiline is-mobile">
                    {availableUnits.map((unit) => (
                      <div key={unit.id} className="column is-narrow">
                        <div
                          className={`card ${
                            formData.units.length >= Barracks.MaxSquadSize
                              ? "has-background-grey-lighter"
                              : "is-clickable"
                          }`}
                          onClick={() => handleAddUnit(unit)}
                          style={{
                            opacity:
                              formData.units.length >= Barracks.MaxSquadSize
                                ? 0.5
                                : 1,
                            cursor:
                              formData.units.length >= Barracks.MaxSquadSize
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <div className="card-content is-flex is-justify-content-center p-0">
                            <div
                              style={{
                                transform: "scale(0.7)",
                              }}
                            >
                              <Card unit={unit} />
                            </div>
                          </div>
                          <footer className="card-footer">
                            <div className="card-footer-item">
                              {formData.units.length >= Barracks.MaxSquadSize
                                ? t("squadEditor.squadFull")
                                : t("squadEditor.clickToAddUnit")}
                            </div>
                          </footer>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="column is-4">
              {/* Squad Stats */}
              <div className="box">
                <h2 className="subtitle">{t("squadEditor.statistics")}</h2>
                <div className="content">
                  <p>
                    <strong
                      className={
                        totalRankPoints > Barracks.MaxSquadRankPoints
                          ? "has-text-danger"
                          : "has-text-success"
                      }
                    >
                      {t("squadEditor.rankPoints")} {totalRankPoints}/
                      {Barracks.MaxSquadRankPoints}
                    </strong>
                  </p>
                  <p>
                    <strong>
                      {t("squadEditor.size")} {formData.units.length}/
                      {Barracks.MaxSquadSize}
                    </strong>
                  </p>
                  {Object.keys(composition).length > 0 && (
                    <>
                      <p>
                        <strong>{t("squadEditor.composition")}</strong>
                      </p>
                      <ul>
                        {Object.keys(composition).map((rank) => (
                          <li key={rank}>
                            {rank}: {composition[rank]}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <div className="buttons is-centered are-medium">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="button is-warning"
                  >
                    {t("squadEditor.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="button is-primary"
                    disabled={!isValid}
                  >
                    {isEditing
                      ? t("squadEditor.edit")
                      : t("squadEditor.create")}
                  </button>
                </div>
                {!isValid && (
                  <div className="notification is-danger is-light">
                    <p className="is-size-7">
                      {totalRankPoints > Barracks.MaxSquadRankPoints &&
                        t("squadEditor.tooManyRankPoints") + " "}
                      {formData.units.length > Barracks.MaxSquadSize &&
                        t("squadEditor.tooManyUnits") + " "}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
