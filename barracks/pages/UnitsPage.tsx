import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Rank, Unit } from "../types";
import { useEvaluations } from "../hooks/useEvaluations";
import { rankPoints, RANK_ORDER } from "../util/rank";
import {
  PlusIcon,
  PrintIcon,
  RankIcon,
  SearchIcon,
  SortIcon,
  StatIcon,
  StatKey,
  TrashIcon,
  GenerateIcon,
} from "../components/Icons";

interface UnitsPageProps {
  units: Unit[];
  onDeleteUnit: (unitId: string) => void;
}

type SortMode = "cost" | "name";

const STATS: StatKey[] = ["health", "range", "power", "move"];

/* =============================================================================
   Liste des unités.
   Vignette compacte plutôt que carte complète : à quarante unités, ce qu'on
   cherche est un nom, un rang et un coût. Les actions sont toujours visibles —
   jamais au survol, qui n'existe pas au doigt.
   ========================================================================== */

export const UnitsPage: React.FC<UnitsPageProps> = ({ units, onDeleteUnit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const evaluations = useEvaluations(units);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<Rank | "all">("all");
  const [sort, setSort] = useState<SortMode>("cost");
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = units.filter((unit) => {
      if (needle && !unit.name.toLowerCase().includes(needle)) return false;
      if (rankFilter !== "all" && evaluations[unit.id]?.rank !== rankFilter) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);

      return (evaluations[b.id]?.cost ?? 0) - (evaluations[a.id]?.cost ?? 0);
    });
  }, [units, evaluations, search, rankFilter, sort]);
  if (units.length === 0) {
    return (
      <div className="empty">
        <div className="empty__slots">
          <div className="empty__slot" />

          <div className="empty__slot" />

          <div className="empty__slot" />
        </div>

        <div className="stack stack--2">
          <div className="empty__title">{t("units.emptyTitle")}</div>
          <div className="empty__text">{t("units.emptyText")}</div>
        </div>

        <div className="empty__actions">
          <Link to="/units/new" className="btn btn--primary">
            <PlusIcon />
            {t("units.newUnit")}
          </Link>

          <Link to="/units/new?generate=1" className="btn">
            <GenerateIcon />
            {t("units.emptyGenerate")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">{t("units.title")}</h1>
        <span className="page__count num">{units.length}</span>
        <div className="spacer" />

        <label className="row row--2" style={{ border: "1px solid var(--border-strong)", padding: "0 10px", height: 36 }}>
          <SearchIcon color="var(--text-faint)" />

          <span className="sr-only">{t("units.search")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("units.search")}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text)",
              font: "inherit",
              width: 160,
            }}
          />
        </label>

        <div className="segmented">
          <button
            className={`segmented__item ${rankFilter === "all" ? "segmented__item--active" : ""}`}
            onClick={() => setRankFilter("all")}
>
            {t("units.filterAll")}
          </button>
          {RANK_ORDER.map((rank, index) => (
            <button
              key={rank}
              title={t(`ranks.${rank}` as never)}
              className={`segmented__item ${rankFilter === rank ? "segmented__item--active" : ""}`}
              onClick={() => setRankFilter(rank)}
>
              R{index + 1}
            </button>
          ))}
        </div>

        <button className="btn btn--sm" onClick={() => setSort(sort === "cost" ? "name" : "cost")}>
          <SortIcon />
          {t(`units.sortBy.${sort}` as never)}
        </button>

        <Link to="/units/print" className="btn btn--sm">
          <PrintIcon />
          {t("print.action")}
        </Link>

        <Link to="/units/new" className="btn btn--primary btn--sm">
          <PlusIcon />
          {t("units.newUnit")}
        </Link>
      </div>

      <div className="unit-grid">
        {visible.map((unit) => {
          const evaluation = evaluations[unit.id];

          return (
            <div key={unit.id} className="unit-tile">
              <div className="unit-tile__art">
                {unit.imageUrl && <img src={unit.imageUrl} alt="" />}
                {evaluation && (
                  <div className="unit-tile__cost" title={t("card.rankPointsFull")}>
                    {rankPoints(evaluation.rank)}
                  </div>
                )}
              </div>

              <div className="unit-tile__ident">
                <RankIcon rank={evaluation?.rank} size={15} color="var(--accent)" />

                <span className="unit-tile__name">{unit.name}</span>
              </div>

              <div className="unit-tile__stats">
                {STATS.map((stat) => (
                  <div key={stat} className="unit-tile__stat" title={t(`stats.${stat}` as never)}>
                    <StatIcon stat={stat} size={10} strokeWidth={2} color="var(--text-faint)" />

                    <span>{unit[stat]}</span>
                  </div>
                ))}
              </div>

              <div className="unit-tile__actions">
                <button
                  className="btn btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/units/${unit.id}/edit`)}
>
                  {t("units.edit")}
                </button>

                <button
                  className="iconbtn"
                  aria-label={`${t("units.delete")} — ${unit.name}`}
                  onClick={() => {
                    if (confirm(t("units.confirmDelete", { name: unit.name }))) {
                      onDeleteUnit(unit.id);
                    }
                  }}
>
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-label list-foot">
        {t("units.shownOf", { shown: visible.length, total: units.length })}
      </div>
    </>
  );
};
