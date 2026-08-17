import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/public-sans/800.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "../styles/tokens.css";
import "../styles/app.css";
import { Navigation } from "./Navigation";
import { Onboarding, isTourDone } from "./Onboarding";
import { UnitsPage } from "../pages/UnitsPage";
import { SquadsPage } from "../pages/SquadsPage";
import { UnitEditorPage } from "../pages/UnitEditorPage";
import { SquadEditorPage } from "../pages/SquadEditorPage";
import { BattlePage } from "../pages/BattlePage";
import { PrintPage } from "../pages/PrintPage";
import { Unit, Squad } from "../types";
import { loadUnits, saveUnits, loadSquads, saveSquads } from "../util/storage";
import { DefaultSquads, DefaultUnits } from "../util/defaults";
import {
  Mode,
  Universe,
  applyMode,
  applyUniverse,
  loadMode,
  loadUniverse,
} from "../util/theme";
import "../i18n"; // Initialize i18n

export const App: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [mode, setMode] = useState<Mode>(loadMode);
  const [universe, setUniverse] = useState<Universe>(loadUniverse);
  // La visite de prise en main s'ouvre à la première visite ; son état
  // « vue » est persisté par le composant lui-même (fin ou premier Passer).
  const [tourOpen, setTourOpen] = useState(() => !isTourDone());

  // Le thème vit sur <html> : il doit être posé avant le premier rendu utile,
  // et le fichier d'univers n'est chargé que s'il est effectivement choisi.
  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  useEffect(() => {
    void applyUniverse(universe);
  }, [universe]);

  useEffect(() => {
    const units = loadUnits();
    DefaultUnits.forEach((u) => {
      const index = units.findIndex((l) => l.id === u.id);
      if (index === -1) {
        units.push(u);
        return;
      }

      // Les unités par défaut sont du contenu éditorial livré par
      // l'application, pas des créations du joueur : leur définition suit donc
      // les mises à jour, sinon un joueur installé de longue date reste
      // indéfiniment sur la version du jour où il est arrivé — et ne voit
      // jamais les capacités ni les illustrations ajoutées depuis.
      // Seule une image téléversée par le joueur (data-URI) est conservée.
      const uploaded = units[index].imageUrl?.startsWith("data:")
        ? units[index].imageUrl
        : undefined;

      units[index] = { ...units[index], ...u };

      if (uploaded) {
        units[index].imageUrl = uploaded;
      }
    });
    setUnits(units);
  }, []);

  useEffect(() => {
    const squads = loadSquads();
    // Les escouades de démarrage ne sont ajoutées que si elles manquent : une
    // escouade par défaut modifiée par le joueur garde ses modifications. La
    // description narrative est héritée si le joueur n'en a pas écrit une.
    DefaultSquads.forEach((squad) => {
      const existing = squads.find((s) => s.id === squad.id);
      if (!existing) {
        squads.push(squad);
      } else if (!existing.description && squad.description) {
        existing.description = squad.description;
      }
    });
    setSquads(squads);
  }, []);

  useEffect(() => {
    saveUnits(units);
  }, [units]);

  useEffect(() => {
    saveSquads(squads);
  }, [squads]);

  const handleSaveUnit = (unit: Unit) => {
    console.log(unit);
    const existingIndex = units.findIndex((u) => u.id === unit.id);
    if (existingIndex !== -1) {
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

  const handleSaveSquad = (squad: Squad) => {
    const existingIndex = squads.findIndex((s) => s.id === squad.id);
    if (existingIndex !== -1) {
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

  return (
    <Router>
      <div className="shell">
        <Navigation
          mode={mode}
          universe={universe}
          onModeChange={setMode}
          onUniverseChange={setUniverse}
          onReplayTour={() => setTourOpen(true)}
        />
        <Onboarding open={tourOpen} onClose={() => setTourOpen(false)} />
        <main className="page">
          <Routes>
            <Route path="/" element={<Navigate to="/units" replace />} />
            <Route
              path="/units"
              element={
                <UnitsPage units={units} onDeleteUnit={handleDeleteUnit} />
              }
            />
            <Route path="/units/print" element={<PrintPage units={units} />} />
            <Route
              path="/units/new"
              element={<UnitEditorPage units={units} onSave={handleSaveUnit} />}
            />
            <Route
              path="/units/:id/edit"
              element={<UnitEditorPage units={units} onSave={handleSaveUnit} />}
            />
            <Route
              path="/squads"
              element={
                <SquadsPage squads={squads} onDeleteSquad={handleDeleteSquad} />
              }
            />
            <Route
              path="/squads/new"
              element={
                <SquadEditorPage
                  squads={squads}
                  availableUnits={units}
                  onSave={handleSaveSquad}
                />
              }
            />
            <Route
              path="/squads/:id/edit"
              element={
                <SquadEditorPage
                  squads={squads}
                  availableUnits={units}
                  onSave={handleSaveSquad}
                />
              }
            />
            <Route
              path="/battle"
              element={<BattlePage squads={squads} units={units} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};
