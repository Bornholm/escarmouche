//go:build js && wasm
// +build js,wasm

package main

import (
	"math/rand"
	"fmt"
	"slices"
	"sync"
	"syscall/js"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/escarmouche/pkg/gen"
	"github.com/bornholm/escarmouche/pkg/sim"
	"github.com/pkg/errors"
)

func main() {
	// Zone de capture et emplacements d'obstacle valides, pour que le front
	// n'ait pas à dupliquer la géométrie du plateau.
	objectiveZone := make([]any, 0, len(sim.ObjectiveZone))
	for _, pos := range sim.ObjectiveZone {
		objectiveZone = append(objectiveZone, map[string]any{"x": pos.X, "y": pos.Y})
	}

	obstaclePositions := make([]any, 0)
	for x := 0; x < sim.BoardSize; x++ {
		for y := 0; y < sim.BoardSize; y++ {
			if sim.IsValidObstaclePosition(sim.Position{X: x, Y: y}) {
				obstaclePositions = append(obstaclePositions, map[string]any{"x": x, "y": y})
			}
		}
	}

	js.Global().Set("Barracks", map[string]any{
		"evaluateUnit":            js.FuncOf(evaluateUnit),
		"generateSquad":           js.FuncOf(generateSquad),
		"generateUnit":            js.FuncOf(generateUnit),
		"getAvailableAbilities":   js.FuncOf(getAvailableAbilities),
		"startGame":               js.FuncOf(startGame),
		"getValidActions":         js.FuncOf(getValidActionsJS),
		"selectAction":            js.FuncOf(selectAction),
		"endGame":                 js.FuncOf(endGame),
		"MaxSquadSize":            js.ValueOf(gen.DefaultMaxSquadSize),
		"SquadBudget":             js.ValueOf(gen.DefaultSquadBudget),
		"MaxUnitCost":             js.ValueOf(core.DefaultCosts.MaxTotal),
		"ControlPointsToWin":      js.ValueOf(sim.ControlPointsToWin),
		"ObjectiveZone":           js.ValueOf(objectiveZone),
		"ValidObstaclePositions":  js.ValueOf(obstaclePositions),
	})

	select {}
}

// ── Existing functions ──────────────────────────────────────────────────────

func evaluateUnit(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		stats := core.Stats{
			Health: args[0].Get("health").Int(),
			Range:  args[0].Get("range").Int(),
			Move:   args[0].Get("move").Int(),
			Power:  args[0].Get("power").Int(),
		}

		abilities := []core.Ability{}

		if jsAbilities := args[0].Get("abilities"); jsAbilities.Truthy() {
			len := jsAbilities.Length()
			ids := make([]string, 0, len)

			for i := 0; i < len; i++ {
				ids = append(ids, jsAbilities.Index(i).String())
			}

			abilities = core.Abilities(ids...)
		}

		evaluation, err := core.Evaluate(stats, abilities, core.DefaultCosts)
		if err != nil {
			return nil, errors.Wrap(err, "could not evaluate unit")
		}

		return map[string]any{
			"rank": evaluation.Rank.String(),
			"cost": evaluation.Cost,
		}, nil
	})
}

func generateSquad(this js.Value, args []js.Value) any {
	return withPromise(func() ([]map[string]any, error) {
		squad, err := gen.RandomSquad(gen.DefaultSquadBudget, gen.DefaultMaxSquadSize, core.DefaultCosts, gen.DefaultArchetypes...)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		jsSquad := slices.Collect(func(yield func(map[string]any) bool) {
			for _, u := range squad {
				unit := map[string]any{
					"health":    u.Stats.Health,
					"move":      u.Stats.Move,
					"range":     u.Stats.Range,
					"power":     u.Stats.Power,
					"cost":      u.TotalCost,
					"rank":      u.Rank.String(),
					"archetype": u.Archetype.Name,
				}
				if !yield(unit) {
					return
				}
			}
		})

		return jsSquad, nil
	})
}

func generateUnit(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		targetCost := args[0].Float()

		archetype, err := gen.ParseArchetype(args[1].String())
		if err != nil {
			return nil, errors.WithStack(err)
		}

		unit, err := gen.RandomUnit(targetCost, archetype, core.DefaultCosts)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		abilities := make([]any, 0, len(unit.Abilities))
		for _, a := range unit.Abilities {
			abilities = append(abilities, a.ID)
		}

		return map[string]any{
			"health":    unit.Stats.Health,
			"move":      unit.Stats.Move,
			"range":     unit.Stats.Range,
			"power":     unit.Stats.Power,
			"cost":      unit.TotalCost,
			"rank":      unit.Rank.String(),
			"archetype": unit.Archetype.Name,
			"abilities": abilities,
		}, nil
	})
}

func withPromise[T any](fn func() (T, error)) js.Value {
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			result, err := fn()
			if err != nil {
				errorConstructor := js.Global().Get("Error")
				errorObject := errorConstructor.New(err.Error())
				reject.Invoke(errorObject)
			} else {
				resolve.Invoke(js.ValueOf(result))
			}
		}()

		return nil
	})

	promiseConstructor := js.Global().Get("Promise")

	return promiseConstructor.New(handler)
}

func getAvailableAbilities(this js.Value, args []js.Value) any {
	return withPromise(func() ([]any, error) {
		language := core.Language(args[0].String())

		core.SetLanguage(language)

		abilities := core.AllAbilities()

		jsAbilities := make([]any, 0, len(abilities))

		for _, a := range abilities {
			jsAbilities = append(jsAbilities, map[string]any{
				"id":          a.ID,
				"description": a.Description.String(),
				"label":       a.Label.String(),
				"cost":        a.Cost,
			})
		}

		return jsAbilities, nil
	})
}

// ── Battle mode ─────────────────────────────────────────────────────────────

type originalUnitData struct {
	Name     string
	ImageURL string
}

type gameSession struct {
	humanPlayerID  sim.PlayerID
	pendingStateCh chan map[string]any
	actionCh       chan int
	doneCh         chan struct{}
	validActions   []sim.Action
	originalUnits  map[sim.UnitID]originalUnitData
	currentTurn    uint
}

var (
	currentSession *gameSession
	sessionMu      sync.Mutex
)

func startGame(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		sessionMu.Lock()
		if currentSession != nil {
			close(currentSession.doneCh)
		}
		session := &gameSession{
			humanPlayerID:  sim.PlayerOne,
			pendingStateCh: make(chan map[string]any, 1),
			actionCh:       make(chan int),
			doneCh:         make(chan struct{}),
			originalUnits:  map[sim.UnitID]originalUnitData{},
		}
		currentSession = session
		sessionMu.Unlock()

		jsUnits := args[0]
		n := jsUnits.Length()

		playerUnits := make([]sim.Unit, 0, n)
		for i := 0; i < n; i++ {
			u := jsUnits.Index(i)
			stats := core.Stats{
				Health: u.Get("health").Int(),
				Range:  u.Get("range").Int(),
				Move:   u.Get("move").Int(),
				Power:  u.Get("power").Int(),
			}
			abilityIDs := []string{}
			if jsAbs := u.Get("abilities"); jsAbs.Truthy() {
				for j := 0; j < jsAbs.Length(); j++ {
					abilityIDs = append(abilityIDs, jsAbs.Index(j).String())
				}
			}
			playerUnits = append(playerUnits, sim.Unit{
				Stats:     stats,
				Abilities: core.Abilities(abilityIDs...),
			})
			session.originalUnits[sim.UnitID(i)] = originalUnitData{
				Name:     u.Get("name").String(),
				ImageURL: u.Get("imageUrl").String(),
			}
		}

		aiSquad, err := gen.RandomSquad(gen.DefaultSquadBudget, gen.DefaultMaxSquadSize, core.DefaultCosts, gen.DefaultArchetypes...)
		if err != nil {
			return nil, errors.Wrap(err, "could not generate AI squad")
		}
		aiUnits := make([]sim.Unit, 0, len(aiSquad))
		for _, u := range aiSquad {
			aiUnits = append(aiUnits, sim.Unit{
				Stats:     core.Stats{Health: u.Stats.Health, Range: u.Stats.Range, Move: u.Stats.Move, Power: u.Stats.Power},
				Abilities: u.Abilities,
			})
		}

		difficulty := "normal"
		if len(args) > 1 && args[1].Type() == js.TypeString {
			difficulty = args[1].String()
		}
		// Profondeur en actions (depth 4 = un tour complet + la réponse) et
		// budget de nœuds calé pour rester réactif en WASM.
		aiDepth, aiBudget := 4, 8000
		switch difficulty {
		case "easy":
			aiDepth, aiBudget = 2, 1500
		case "hard":
			aiDepth, aiBudget = 6, 30000
		}

		// Sur un appareil tactile (CPU mobile), le même budget prend plusieurs
		// secondes par action : on le réduit pour garder le jeu vivant. La
		// profondeur maximale est conservée — l'approfondissement itératif
		// rend simplement le meilleur coup de la dernière passe complète.
		if len(args) > 3 && args[3].Type() == js.TypeBoolean && args[3].Bool() {
			aiBudget = aiBudget * 2 / 5
		}

		// Obstacle posé par le joueur pendant la mise en place ; l'IA pose le
		// sien sur sa moitié de plateau, en biais devant la zone centrale.
		obstacles := []sim.Position{}
		if len(args) > 2 && args[2].Type() == js.TypeObject {
			pos := sim.Position{X: args[2].Get("x").Int(), Y: args[2].Get("y").Int()}
			if sim.IsValidObstaclePosition(pos) {
				obstacles = append(obstacles, pos)
			}
		}
		if len(obstacles) > 0 {
			aiObstacle := sim.Position{X: 2 + rand.Intn(4), Y: 5}
			if aiObstacle == obstacles[0] {
				aiObstacle.X = (aiObstacle.X+1)%4 + 2
			}
			obstacles = append(obstacles, aiObstacle)
		}

		go func() {
			// Chaque action jouée depuis la dernière main rendue au joueur, avec
			// l'instantané du plateau juste après son application. C'est ce qui
			// permet au front de REJOUER le tour au lieu de téléporter le
			// plateau à l'état final : sans ces images intermédiaires, le joueur
			// subit le résultat sans jamais voir la cause.
			recentSteps := []map[string]any{}

			humanStrategy := sim.StrategyFunc(func(state sim.GameState, playerID sim.PlayerID) sim.Action {
				validActions := sim.GetValidActionsForPlayer(state, playerID)
				session.validActions = validActions

				replay := recentSteps
				recentSteps = nil

				jsState := serializeState(state, validActions, session, false, -1, int(session.currentTurn), replay)

				select {
				case session.pendingStateCh <- jsState:
				case <-session.doneCh:
					return nil
				}

				select {
				case idx := <-session.actionCh:
					if idx >= 0 && idx < len(validActions) {
						return validActions[idx]
					}
					return nil
				case <-session.doneCh:
					return nil
				}
			})

			game := sim.NewGame(playerUnits, aiUnits,
				sim.WithPlayerStrategy(sim.PlayerOne, humanStrategy),
				sim.WithPlayerStrategy(sim.PlayerTwo, sim.SearchStrategy(aiDepth, aiBudget)),
				sim.WithObstacles(obstacles...),
			)

			for step := range game.Run() {
				session.currentTurn = step.Turn

				select {
				case <-session.doneCh:
					return
				default:
				}

				// On capture l'action AVANT le test de fin de partie : le coup
				// fatal doit être rejouable, sinon la partie se termine sur un
				// plateau qui a sauté.
				if step.Action != nil {
					desc := describeAction(-1, step.Action, session)
					desc["playerID"] = int(step.Player)
					desc["frame"] = serializeFrame(game.State())
					recentSteps = append(recentSteps, desc)
				}

				if step.IsOver {
					jsState := serializeState(game.State(), nil, session, true, int(step.Winner), int(step.Turn), recentSteps)
					select {
					case session.pendingStateCh <- jsState:
					case <-session.doneCh:
					}
					return
				}
			}
		}()

		select {
		case initialState := <-session.pendingStateCh:
			return initialState, nil
		case <-session.doneCh:
			return nil, errors.New("game cancelled before start")
		}
	})
}

func getValidActionsJS(this js.Value, args []js.Value) any {
	sessionMu.Lock()
	session := currentSession
	sessionMu.Unlock()

	if session == nil {
		return js.ValueOf([]any{})
	}

	result := make([]any, 0, len(session.validActions))
	for i, action := range session.validActions {
		result = append(result, describeAction(i, action, session))
	}
	return js.ValueOf(result)
}

func selectAction(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		sessionMu.Lock()
		session := currentSession
		sessionMu.Unlock()

		if session == nil {
			return nil, errors.New("no active game session")
		}

		idx := args[0].Int()

		select {
		case session.actionCh <- idx:
		case <-session.doneCh:
			return nil, errors.New("game ended")
		}

		select {
		case nextState := <-session.pendingStateCh:
			return nextState, nil
		case <-session.doneCh:
			return nil, errors.New("game ended")
		}
	})
}

func endGame(this js.Value, args []js.Value) any {
	sessionMu.Lock()
	defer sessionMu.Unlock()

	if currentSession != nil {
		close(currentSession.doneCh)
		currentSession = nil
	}
	return nil
}

// ── Serialization ────────────────────────────────────────────────────────────

func serializeState(state sim.GameState, validActions []sim.Action, session *gameSession, isOver bool, winner int, turn int, recentSteps []map[string]any) map[string]any {
	units := make([]any, 0, len(state.Units))
	for _, unit := range state.Units {
		pos := state.Positions[unit.ID]
		health := state.Get(unit.ID, sim.CounterHealth, 0)

		orig := session.originalUnits[unit.ID]

		abilities := make([]any, 0, len(unit.Abilities))
		for _, a := range unit.Abilities {
			abilities = append(abilities, a.ID)
		}

		units = append(units, map[string]any{
			"id":              int(unit.ID),
			"ownerID":         int(unit.OwnerID),
			"name":            orig.Name,
			"imageURL":        orig.ImageURL,
			"health":          health,
			"maxHealth":       unit.Stats.Health,
			"range":           unit.Stats.Range,
			"power":           unit.Stats.Power,
			"move":            unit.Stats.Move,
			"abilities":       abilities,
			"x":               pos.X,
			"y":               pos.Y,
			"suppressed":      state.Get(unit.ID, sim.CounterSuppressed, 0) > 0,
			"untargetable":    state.Get(unit.ID, sim.CounterUntargetable, 0) > 0,
			"overcharged": state.Get(unit.ID, sim.CounterOverchargePending, 0) > 0 ||
				state.Get(unit.ID, sim.CounterOverchargeLock, 0) > 0,
			"defensiveStance": state.Get(unit.ID, sim.CounterDefensiveStance, 0) > 0,
			"guardianOf":      state.Get(unit.ID, sim.CounterGuardianOf, -1),
		})
	}

	validActionsJS := make([]any, 0)
	for i, action := range validActions {
		validActionsJS = append(validActionsJS, describeAction(i, action, session))
	}

	recentActionsAny := make([]any, 0, len(recentSteps))
	for _, a := range recentSteps {
		recentActionsAny = append(recentActionsAny, a)
	}

	obstacles := make([]any, 0, len(state.Obstacles))
	for x := 0; x < sim.BoardSize; x++ {
		for y := 0; y < sim.BoardSize; y++ {
			pos := sim.Position{X: x, Y: y}
			if state.Obstacles[pos.String()] {
				obstacles = append(obstacles, map[string]any{"x": x, "y": y})
			}
		}
	}

	return map[string]any{
		"units":           units,
		"currentPlayerID": int(state.CurrentPlayerID),
		"humanPlayerID":   int(session.humanPlayerID),
		"actionsLeft":     state.ActionsLeft,
		"isOver":          isOver,
		"winner":          winner,
		"turn":            turn,
		"validActions":    validActionsJS,
		"recentActions":   recentActionsAny,
		"obstacles":       obstacles,
		"controlPoints": map[string]any{
			"player": state.ControlPoints[session.humanPlayerID],
			"ai":     state.ControlPoints[getOpponent(session.humanPlayerID)],
		},
	}
}

// serializeFrame produit un instantané léger du plateau : juste ce qu'il faut
// pour rejouer une action à l'écran (positions, santé, statuts). Les actions
// valides et les métadonnées de partie en sont volontairement absentes — une
// image de rejeu n'est pas un état jouable.
func serializeFrame(state sim.GameState) map[string]any {
	units := make([]any, 0, len(state.Units))

	for _, unit := range state.Units {
		pos := state.Positions[unit.ID]
		units = append(units, map[string]any{
			"id":              int(unit.ID),
			"x":               pos.X,
			"y":               pos.Y,
			"health":          state.Get(unit.ID, sim.CounterHealth, 0),
			"suppressed":      state.Get(unit.ID, sim.CounterSuppressed, 0) > 0,
			"untargetable":    state.Get(unit.ID, sim.CounterUntargetable, 0) > 0,
			"overcharged": state.Get(unit.ID, sim.CounterOverchargePending, 0) > 0 ||
				state.Get(unit.ID, sim.CounterOverchargeLock, 0) > 0,
			"defensiveStance": state.Get(unit.ID, sim.CounterDefensiveStance, 0) > 0,
			"guardianOf":      state.Get(unit.ID, sim.CounterGuardianOf, -1),
		})
	}

	return map[string]any{
		"units":           units,
		"actionsLeft":     state.ActionsLeft,
		"currentPlayerID": int(state.CurrentPlayerID),
		"controlPointsP1": state.ControlPoints[sim.PlayerOne],
		"controlPointsP2": state.ControlPoints[sim.PlayerTwo],
	}
}

func describeAction(index int, action sim.Action, session *gameSession) map[string]any {
	desc := map[string]any{
		"index":        index,
		"type":         "",
		"abilityID":    "",
		"sourceUnitID": -1,
		"targetUnitID": -1,
		"targetX":      -1,
		"targetY":      -1,
		"label":        action.String(),
	}

	switch a := action.(type) {
	case *sim.MoveAction:
		desc["type"] = "move"
		desc["sourceUnitID"] = int(a.UnitID())
		desc["targetX"] = a.TargetPos().X
		desc["targetY"] = a.TargetPos().Y
		name := unitName(a.UnitID(), session)
		desc["label"] = fmt.Sprintf("%s → (%d,%d)", name, a.TargetPos().X, a.TargetPos().Y)

	case *sim.AttackAction:
		desc["type"] = "attack"
		desc["sourceUnitID"] = int(a.UnitID())
		desc["targetUnitID"] = int(a.TargetID())
		srcName := unitName(a.UnitID(), session)
		tgtName := unitName(a.TargetID(), session)
		desc["label"] = fmt.Sprintf("%s ⚔ %s", srcName, tgtName)

	case *sim.AbilityAction:
		desc["type"] = "ability"
		desc["abilityID"] = a.ID()
		if d := a.Description(); d != nil {
			desc["sourceUnitID"] = int(d.SourceUnitID)
			desc["targetUnitID"] = int(d.TargetUnitID)
			desc["targetX"] = d.TargetX
			desc["targetY"] = d.TargetY
			srcName := unitName(d.SourceUnitID, session)
			desc["label"] = fmt.Sprintf("%s : %s", srcName, a.ID())
		}
	}

	return desc
}

func getOpponent(playerID sim.PlayerID) sim.PlayerID {
	if playerID == sim.PlayerOne {
		return sim.PlayerTwo
	}
	return sim.PlayerOne
}

func unitName(id sim.UnitID, session *gameSession) string {
	if orig, ok := session.originalUnits[id]; ok && orig.Name != "" {
		return orig.Name
	}
	return fmt.Sprintf("Unit%d", id)
}
