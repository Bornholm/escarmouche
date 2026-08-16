import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Unit, Rank, Archetype, GeneratedUnit } from "../types";
import { UnitCard } from "../components/UnitCard";
import { generateId } from "../util/storage";
import { fileToBase64, validateImageFile, resizeImage } from "../components/imageUtils";
import { BASE_URL } from "../util/baseUrl";
import { useAsyncMemo } from "../hooks/useAsyncMemo";
import { useAbilities, resolveAbilities } from "../hooks/useAbilities";
import { useMarginalCosts } from "../hooks/useMarginalCosts";
import { formatCost, maxUnitCost, rankLadder, rankPoints } from "../util/rank";
import {
  ArchetypeIcon,
  BackIcon,
  CloseIcon,
  GenerateIcon,
  MinusIcon,
  PlusIcon,
  RankIcon,
  StatIcon,
  StatKey,
  UploadIcon,
} from "../components/Icons";

interface UnitEditorPageProps {
  units: Unit[];
  onSave: (unit: Unit) => void;
}

const STATS: StatKey[] = ["health", "range", "power", "move"];

const MAX_STAT = 10;

const MAX_ABILITIES = 3;

const RANKS: Rank[] = [Rank.Trooper, Rank.Veteran, Rank.Elite, Rank.Champion, Rank.Paragon];

const ARCHETYPES: Archetype[] = [
  Archetype.JackOfAllTrades,
  Archetype.Tank,
  Archetype.Sniper,
  Archetype.Skirmisher,
  Archetype.Bruiser,
  Archetype.GlassCannon,
];

const PRESET_IMAGES = [
  "templar_knight.png",
  "elven_archer.png",
  "fire_mage.png",
  "orc_warrior.png",
  "orc_javelin.png",
  "orc_shaman.png",
];

const imageForArchetype = (archetype: Archetype): string => {
  switch (archetype) {
    case Archetype.Tank: return `${BASE_URL}/templar_knight.png`;
    case Archetype.Bruiser: return `${BASE_URL}/orc_warrior.png`;
    case Archetype.Sniper: return `${BASE_URL}/elven_archer.png`;
    case Archetype.Skirmisher: return `${BASE_URL}/orc_javelin.png`;
    case Archetype.GlassCannon: return `${BASE_URL}/fire_mage.png`;
    default: return `${BASE_URL}/templar_knight.png`;
  }
};

const emptyUnit = (): Unit => ({
  id: generateId(),
  name: "",
  health: 1,
  move: 1,
  range: 1,
  power: 1,
  imageUrl: `${BASE_URL}/templar_knight.png`,
  abilities: [],
});

export const UnitEditorPage: React.FC<UnitEditorPageProps> = ({ units, onSave }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = id !== undefined && id !== "new";
  const existingUnit = isEditing ? units.find((u) => u.id === id) : undefined;
  const [formData, setFormData] = useState<Unit>(emptyUnit);
  const [selectedRank, setSelectedRank] = useState<Rank>(Rank.Trooper);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(Archetype.JackOfAllTrades);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"settings" | "card">("settings");
  const [previousRank, setPreviousRank] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalog = useAbilities();
  const evaluation = useAsyncMemo(() => Barracks.evaluateUnit(formData), [formData]);
  const marginal = useMarginalCosts(formData, evaluation?.cost);
  const abilities = resolveAbilities(formData.abilities, catalog);
  useEffect(() => {
    setFormData(existingUnit ? { ...existingUnit } : emptyUnit());
  }, [existingUnit]);

  // Le franchissement de rang est le seul geste animé du châssis.
  const rankChanged = evaluation?.rank !== undefined && previousRank !== undefined && evaluation.rank !== previousRank;
  useEffect(() => {
    if (evaluation?.rank) setPreviousRank(evaluation.rank);
  }, [evaluation?.rank]);
  const ladder = useMemo(() => rankLadder(evaluation?.rank), [evaluation?.rank]);
  const costMax = maxUnitCost();
  const overBudget = (evaluation?.cost ?? 0) > costMax;
  const setStat = (stat: StatKey, value: number) => {
    setFormData((prev) => ({ ...prev, [stat]: Math.max(1, Math.min(MAX_STAT, value)) }));
  };

  const removeAbility = (abilityId: string) => {
    setFormData((prev) => ({ ...prev, abilities: prev.abilities.filter((a) => a !== abilityId) }));
  };

  const addAbility = (abilityId: string) => {
    if (!abilityId || formData.abilities.includes(abilityId)) return;
    if (formData.abilities.length >= MAX_ABILITIES) return;
    setFormData((prev) => ({ ...prev, abilities: [...prev.abilities, abilityId] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated: GeneratedUnit = await Barracks.generateUnit(selectedRank, selectedArchetype);
      setFormData((prev) => ({
        ...prev,
        id: prev.id || generateId(),
        name: `${t(`ranks.${generated.rank}` as never)} · ${t(`archetypes.${generated.archetype}` as never)}`,
        health: generated.health,
        move: generated.move,
        range: generated.range,
        power: generated.power,
        imageUrl: imageForArchetype(generated.archetype),
        abilities: generated.abilities,
      }));
    } catch (error) {
      console.error("Failed to generate unit:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Arrivée depuis l'état vide avec « générer au hasard ».
  useEffect(() => {
    if (searchParams.get("generate") === "1" && !isEditing) void handleGenerate();
  }, []);
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || t("unitEditor.invalidFile"));
        return;
      }
      const base64 = await fileToBase64(file);
      const resized = await resizeImage(base64, 400, 400);
      setFormData((prev) => ({ ...prev, imageUrl: resized }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(t("unitEditor.uploadError"));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    navigate("/units");
  };

  const availableToAdd = (catalog ?? []).filter((a) => !formData.abilities.includes(a.id));

  return (
    <form onSubmit={handleSubmit}>
      <div className="page__head">
        <button type="button" className="btn btn--sm" onClick={() => navigate("/units")}>
          <BackIcon />
          {t("unitEditor.back")}
        </button>

        <h1 className="page__title">
          {isEditing ? t("unitEditor.editUnit") : t("unitEditor.createUnit")}
        </h1>

        <span className="page__count">#{formData.id.slice(0, 6)}</span>
      </div>
      {/* Onglets mobiles : le réglage et la carte ne tiennent pas côte à côte */}
      <div className="editor__tabs">
        <button
          type="button"
          className={`editor__tab ${mobileTab === "settings" ? "editor__tab--active" : ""}`}
          onClick={() => setMobileTab("settings")}
>
          {t("unitEditor.tabSettings")}
        </button>

        <button
          type="button"
          className={`editor__tab ${mobileTab === "card" ? "editor__tab--active" : ""}`}
          onClick={() => setMobileTab("card")}
>
          {t("unitEditor.tabCard")}
        </button>
      </div>

      <div className="editor">
        <div className={`editor__form ${mobileTab === "card" ? "editor__pane--hidden" : ""}`}>
          <section className="panel__section">
            <div className="section-label">{t("unitEditor.unitDetails")}</div>
            <label className="field">
              <span className="field__label">{t("unitEditor.name")}</span>
              <input
                className="input"
                type="text"
                value={formData.name}
                required
                placeholder={t("unitEditor.unitNamePlaceholder")}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
          </section>

          <section className="panel__section">
            <div className="row row--3">
              <div className="section-label">{t("unitEditor.characteristics")}</div>
              <div className="spacer" />

              <div className="hint">{t("unitEditor.nextNotchHint")}</div>
            </div>
            {STATS.map((stat) => {
              const value = formData[stat];
              const delta = marginal[stat];

              return (
                <div key={stat} className="stat-row">
                  <div className="stat-row__label">
                    <StatIcon stat={stat} size={17} strokeWidth={1.7} color="var(--text-dim)" />

                    <span>{t(`stats.${stat}Full` as never)}</span>
                  </div>

                  <div className="stat-stepper" style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="stepbtn stepbtn--compact"
                      aria-label={t("unitEditor.decrease")}
                      disabled={value <= 1}
                      onClick={() => setStat(stat, value - 1)}
>
                      <MinusIcon />
                    </button>

                    <div className="track" role="group" aria-label={t(`stats.${stat}Full` as never)}>
                      {Array.from({ length: MAX_STAT }, (_, index) => {
                        const notch = index + 1;

                        return (
                          <button
                            type="button"
                            key={notch}
                            aria-label={`${t(`stats.${stat}Full` as never)} ${notch}`}
                            aria-pressed={notch === value}
                            onClick={() => setStat(stat, notch)}
                            className={`track__seg ${notch <= value ? "track__seg--filled" : ""} ${
                              notch === value + 1 ? "track__seg--next" : ""
                            }`}
                          />
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="stepbtn stepbtn--compact"
                      aria-label={t("unitEditor.increase")}
                      disabled={value >= MAX_STAT}
                      onClick={() => setStat(stat, value + 1)}
>
                      <PlusIcon />
                    </button>
                  </div>

                  <div className="stat-row__value">
                    <span className="stat-row__num">{value}</span>
                    <span className={`pill ${delta !== undefined && delta > 0 ? "pill--accent" : ""}`}>
                      {delta === undefined ? "—" : `+${formatCost(Math.round(delta * 10) / 10)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="panel__section">
            <div className="row row--3">
              <div className="section-label">{t("unitEditor.abilities")}</div>
              <div className="spacer" />

              <span className="num" className="meta">
                {formData.abilities.length} / {MAX_ABILITIES}
              </span>
            </div>

            <div className="stack stack--2">
              {abilities.map((ability, index) => (
                <div key={ability.id} className="ability-row">
                  <span className="ability-row__index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="grow-min">
                    <div className="ability-row__name">{ability.label}</div>
                    <div className="ability-row__desc">{ability.description}</div>
                  </div>

                  <span className="ability-row__cost num">+{ability.cost}</span>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label={`${t("unitEditor.removeAbility")} — ${ability.label}`}
                    onClick={() => removeAbility(ability.id)}
>
                    <CloseIcon />
                  </button>
                </div>
              ))}
              {formData.abilities.length < MAX_ABILITIES && (
                <label className="btn btn--dashed" style={{ position: "relative" }}>
                  <PlusIcon />
                  {t("unitEditor.addAbility")}
                  <select
                    value=""
                    onChange={(event) => addAbility(event.target.value)}
                    aria-label={t("unitEditor.addAbility")}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                      width: "100%",
                    }}
>
                    <option value="">{t("unitEditor.addAbility")}</option>
                    {availableToAdd.map((ability) => (
                      <option key={ability.id} value={ability.id}>
                        {ability.label} (+{ability.cost})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>

          <div className="editor__split">
            <section className="panel__section">
              <div className="section-label">{t("unitEditor.illustration")}</div>
              <label className="dropzone">
                <UploadIcon color="var(--text-faint)" />

                <div className="meta-sm">
                  {isUploadingImage ? t("unitEditor.uploading") : t("unitEditor.dropImage")}
                </div>

                <div className="section-label">{t("unitEditor.supportedFormats")}</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
              {uploadError && <div className="notice notice--danger">{uploadError}</div>}
              <div className="row row--2 row--wrap">
                {PRESET_IMAGES.map((image) => {
                  const url = `${BASE_URL}/${image}`;

                  return (
                    <button
                      type="button"
                      key={image}
                      className={`thumb ${formData.imageUrl === url ? "thumb--active" : ""}`}
                      aria-label={image}
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: url }))}
>
                      <img src={url} alt="" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel__section">
              <div className="section-label">{t("unitEditor.randomGeneration")}</div>
              <div className="field">
                <span className="field__label">{t("unitEditor.rank")}</span>
                <div className="segmented">
                  {RANKS.map((rank, index) => (
                    <button
                      type="button"
                      key={rank}
                      title={t(`ranks.${rank}` as never)}
                      className={`segmented__item ${selectedRank === rank ? "segmented__item--active" : ""}`}
                      onClick={() => setSelectedRank(rank)}
>
                      R{index + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field__label">{t("unitEditor.archetype")}</span>
                <div className="tilegrid">
                  {ARCHETYPES.map((archetype) => (
                    <button
                      type="button"
                      key={archetype}
                      className={`tilegrid__item ${
                        selectedArchetype === archetype ? "tilegrid__item--active" : ""
                      }`}
                      onClick={() => setSelectedArchetype(archetype)}
>
                      <ArchetypeIcon archetype={archetype} size={18} />

                      <span>{t(`archetypes.${archetype}` as never)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="btn" onClick={handleGenerate} disabled={isGenerating}>
                <GenerateIcon />
                {isGenerating ? t("unitEditor.generating") : t("unitEditor.generateRandomUnit")}
              </button>
            </section>
          </div>
        </div>

        <aside className={`editor__aside ${mobileTab === "settings" ? "editor__pane--hidden-mobile" : ""}`}>
          <div className="eval">
            <div className="eval__top">
              <div className="stack stack--2">
                <div className="section-label">{t("unitEditor.evaluation")}</div>
                <div className="row row--2" >
                  <span
                    key={evaluation?.cost}
                    className={`eval__cost ${overBudget ? "eval__cost--over" : ""} eval__cost--tick`}
>
                    {formatCost(evaluation?.cost)}
                  </span>

                  <span className="eval__max">/ {costMax}</span>
                </div>
              </div>

              <div className={`eval__rank ${rankChanged ? "eval__rank--pop" : ""}`}>
                <RankIcon rank={evaluation?.rank} size={52} strokeWidth={1.4} color="var(--accent)" />

                <div className="eval__rank-name">
                  {evaluation ? t(`ranks.${evaluation.rank}` as never) : "—"}
                </div>

                <div className="section-label">
                  {t("card.rankPoints", { points: rankPoints(evaluation?.rank) })}
                </div>
              </div>
            </div>

            <div className="stack stack--2">
              <div className="ladder">
                {ladder.map((step) => (
                  <div
                    key={step.rank}
                    className={`ladder__seg ${step.reached ? "ladder__seg--reached" : ""}`}
                    style={{ flex: step.points }}
                  />
                ))}
              </div>

              <div className="ladder__labels">
                {ladder.map((step) => (
                  <span key={step.rank} className={step.current ? "ladder__label--current" : ""}>
                    {t(`ranks.${step.rank}` as never)}
                  </span>
                ))}
              </div>
              {overBudget && <div className="notice notice--danger">{t("unitEditor.overBudget", { max: costMax })}</div>}
            </div>
          </div>

          <div className="panel__section">
            <div className="section-label">{t("unitEditor.preview")}</div>
            <div className="row" >
              <UnitCard unit={formData} variant="preview" />
            </div>
          </div>

          <div className="editor__actions">
            <button type="button" className="btn" onClick={() => navigate("/units")}>
              {t("unitEditor.cancel")}
            </button>

            <button type="submit" className="btn btn--primary" style={{ flex: 1 }}>
              {isEditing ? t("unitEditor.save") : t("unitEditor.create")}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
};
