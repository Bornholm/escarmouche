import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "bulma/css/bulma.min.css";
import { Navigation } from "./Navigation";
import { UnitsPage } from "../pages/UnitsPage";
import { SquadsPage } from "../pages/SquadsPage";
import { UnitEditorPage } from "../pages/UnitEditorPage";
import { SquadEditorPage } from "../pages/SquadEditorPage";
import { Unit, Squad } from "../types";
import { loadUnits, saveUnits, loadSquads, saveSquads } from "../util/storage";
import { DefaultUnits } from "../util/defaults";
import { BASE_URL } from "../util/baseUrl";

export const App: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);

  useEffect(() => {
    const units = loadUnits();
    DefaultUnits.forEach((u, i) => {
      const index = units.findIndex((l) => l.id === u.id);
      if (index === -1) {
        units.push(u);
      } else {
        units[index] = { ...u };
      }
    });
    setUnits(units);
  }, []);

  useEffect(() => {
    const squads = loadSquads();
    setSquads(squads);
  }, []);

  useEffect(() => {
    saveUnits(units);
  }, [units]);

  useEffect(() => {
    saveSquads(squads);
  }, [squads]);

  const handleSaveUnit = (unit: Unit) => {
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

  const basePath: string = useMemo(() => {
    const url = new URL(BASE_URL);
    return url.pathname;
  }, [BASE_URL]);

  return (
    <Router basename={basePath}>
      <div
        className="app has-background-dark has-text-light"
        style={{ minHeight: "100vh" }}
      >
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/units" replace />} />
            <Route
              path="/units"
              element={
                <UnitsPage units={units} onDeleteUnit={handleDeleteUnit} />
              }
            />
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
          </Routes>
        </main>
      </div>
    </Router>
  );
};
