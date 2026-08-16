# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Escarmouche is a tabletop wargame companion app. It consists of:
- A React/TypeScript frontend called **Barracks** (unit/squad editor)
- A Go game engine compiled to **WebAssembly** (exposes unit evaluation and generation to the browser)
- A Go CLI tool **`balancer`** (evolutionary algorithm for game balance tuning)
- Static game **rules** documentation in Markdown (fr-FR, en-EN, es-ES)

## Build Commands

```bash
make build          # Full build: website + wasm + barracks app + CLI tools
make wasm-lib       # Compile Go → WASM (outputs dist/wasm/barracks.wasm)
make barracks-app   # i18n extraction + wasm + Parcel bundle (outputs dist/barracks/)
make cmd            # Build Go CLI binaries (outputs bin/)
make website        # Build rules website (requires amatl, yq, jq — downloaded automatically)
make watch          # Dev watch via modd (rebuilds wasm on Go changes, serves frontend)
```

Dev server (started by `make watch` / modd):
- Barracks app: `BASE_URL=http://localhost:1234 npx parcel serve ./barracks/index.html`
- Website preview: `npx http-server --port 8080 ./dist/website`

i18n key extraction (run after adding/removing `t()` calls or `<Trans>` components):
```bash
npx i18next-cli extract --sync-primary
```

## Running Tests

```bash
go test ./pkg/...                              # All Go tests
go test ./pkg/sim/... -run TestFuzzyStrategy   # Single test by name
```

No JavaScript test suite is configured.

## Architecture

### Go packages (`pkg/`)

| Package | Role |
|---|---|
| `core` | Fundamental types: `Stats`, `Ability`, `Costs`, `Rank`. Cost calculation is the game's only currency; ranks are narrative cost bands. Abilities are loaded from embedded YAML files in `pkg/core/abilities/`. |
| `gen` | Random unit/squad generation by `Rank` and `Archetype`. Entry points: `gen.RandomUnit`, `gen.RandomSquad`. |
| `sim` | Turn-based game simulation on an 8×8 grid with a central 2×2 capture zone and player-placed obstacles. `Game.Run()` returns an iterator of `GameStep`. AI is an alpha-beta search over the real turn structure (`SearchStrategy`). Abilities are implemented as numbered files (`00000-charge.go`, etc.). |
| `balancing` | Evolutionary/genetic algorithm that optimises `core.Costs` by running simulations in tournaments. |
| `barracks/wasm` | WebAssembly entry point. Registers a global `Barracks` JS object exposing: `evaluateUnit`, `generateUnit`, `generateSquad`, `getAvailableAbilities`. |

### Frontend (`barracks/`)

React 19 + React Router 7 (HashRouter for GitHub Pages compatibility), custom design-token CSS (no framework), bundled with Parcel.

**Boot sequence**: `index.tsx` fetches and instantiates `barracks.wasm` via `WebAssembly.instantiateStreaming`, then mounts the React app. All calls to Go logic go through the `Barracks.*` global functions defined in `barracks.d.ts`.

**State**: Units and squads are persisted in `localStorage` via `barracks/util/storage.ts`. Default units are merged on load (`barracks/util/defaults.ts`).

**i18n**: `i18next` with `i18next-http-backend` loads JSON files from `barracks/locales/{lng}/{ns}.json`. The `IgnoreTrans` component suppresses extraction for dynamic content. Types are generated into `barracks/resources.d.ts`.

### Adding a new Ability

1. Create `pkg/core/abilities/NNNNN-<name>.yml` with `label`, `description` (supporting `fr`, `en`, `es` keys), and `cost`.
2. Create `pkg/sim/NNNNN-<name>.go` implementing the ability's effect by registering it via `init()` (follow the existing pattern).
3. Rebuild WASM: `make wasm-lib`.

### Languages

Supported locales: `fr-FR`, `en-EN`, `es-ES` (rules/website) and `fr`, `en`, `es` (frontend i18n).
