package sim

import (
	"iter"
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
)

type Unit struct {
	Stats     core.Stats
	Abilities []core.Ability
}

type Game struct {
	turn       uint
	players    []PlayerID
	strategies map[PlayerID]StrategyFunc
	state      GameState
	maxTurns   uint
}

func NewGame(player1 []Unit, player2 []Unit, funcs ...OptionFunc) *Game {
	opts := NewOptions(funcs...)

	gameState := GameState{
		counters:      map[UnitID]map[string]int{},
		Board:         map[string]UnitID{},
		Positions:     map[UnitID]Position{},
		Units:         map[UnitID]*PlayerUnit{},
		Obstacles:     map[string]bool{},
		ControlPoints: map[PlayerID]int{},
		TurnsPlayed:   map[PlayerID]int{},
		Rules:         opts.CaptureRules,
		ActionRules:   opts.ActionRules,
	}

	var unitID UnitID = 0

	initSquad := func(playerID PlayerID, row int, units []Unit) {
		availablePositions := []int{0, 1, 2, 3, 4, 5, 6, 7}

		rand.Shuffle(len(availablePositions), func(i, j int) {
			availablePositions[i], availablePositions[j] = availablePositions[j], availablePositions[i]
		})

		placed := opts.Deployment[playerID]

		for i, u := range units {
			pos := Position{X: availablePositions[i], Y: row}
			if i < len(placed) {
				pos = placed[i]
			}
			unit := &PlayerUnit{
				ID:      unitID,
				OwnerID: playerID,
				Unit: Unit{
					Stats: core.Stats{
						Health: u.Stats.Health,
						Range:  u.Stats.Range,
						Power:  u.Stats.Power,
						Move:   u.Stats.Move,
					},
					Abilities: append([]core.Ability{}, u.Abilities...),
				},
			}

			gameState.Set(unit.ID, CounterHealth, u.Stats.Health)

			gameState.Board[pos.String()] = unit.ID
			gameState.Positions[unit.ID] = pos
			gameState.Units[unitID] = unit

			unitID++
		}
	}

	initSquad(PlayerOne, 0, player1)
	initSquad(PlayerTwo, 7, player2)

	// Obstacles : un par joueur. Fournis par l'appelant (phase de mise en
	// place interactive) ou tirés au hasard parmi les emplacements valides.
	obstacles := opts.Obstacles
	if len(obstacles) == 0 {
		obstacles = randomObstacles(gameState, 2)
	}
	for _, pos := range obstacles {
		if IsValidObstaclePosition(pos) {
			if _, occupied := gameState.Board[pos.String()]; !occupied {
				gameState.Obstacles[pos.String()] = true
			}
		}
	}

	players := []PlayerID{PlayerOne, PlayerTwo}

	rand.Shuffle(len(players), func(i, j int) {
		players[i], players[j] = players[j], players[i]
	})

	gameState.CurrentPlayerID = players[0]

	return &Game{
		state:      gameState,
		players:    players,
		turn:       0,
		strategies: opts.Strategies,
		maxTurns:   opts.MaxTurns, // Prevent infinite games
	}
}

// randomObstacles tire des emplacements d'obstacle valides et libres.
func randomObstacles(state GameState, count int) []Position {
	candidates := make([]Position, 0)
	for x := 0; x < BoardSize; x++ {
		for y := 0; y < BoardSize; y++ {
			pos := Position{X: x, Y: y}
			if !IsValidObstaclePosition(pos) {
				continue
			}
			if _, occupied := state.Board[pos.String()]; occupied {
				continue
			}
			candidates = append(candidates, pos)
		}
	}
	rand.Shuffle(len(candidates), func(i, j int) {
		candidates[i], candidates[j] = candidates[j], candidates[i]
	})
	if count > len(candidates) {
		count = len(candidates)
	}
	return candidates[:count]
}

func (g *Game) State() GameState {
	return g.state
}

func (g *Game) Turn() uint {
	return g.turn
}

type GameStep struct {
	Action Action
	Player PlayerID
	Turn   uint
	IsOver bool
	Winner PlayerID
}

// beginTurn applique les transitions de début de tour pour le joueur donné.
// Partagée entre la boucle de jeu et le minimax : l'IA simule exactement les
// mêmes règles que le moteur.
//
// Sémantique des statuts (alignée sur le texte des cartes) :
//   - les protections posées sur soi (Inciblable, Gardien) durent « jusqu'au
//     début de votre prochain tour » : elles expirent ici ;
//   - la Surcharge en attente se transforme en verrou d'attaque pour CE tour ;
//   - la Posture Défensive n'expire pas avec le temps : elle est consommée
//     par le prochain point de dégât (cf. applyDamage).
func beginTurn(state GameState, playerID PlayerID) GameState {
	state.CurrentPlayerID = playerID
	state.ActionsLeft = state.actionsFor(playerID)

	state.DelAll(CounterRoundAttacks)
	state.DelAll(CounterRoundAbilities)
	state.DelAll(CounterRoundActions)

	for _, unit := range state.Units {
		if unit.OwnerID != playerID {
			continue
		}
		state.Del(unit.ID, CounterUntargetable)
		state.Del(unit.ID, CounterGuardianOf)

		if state.Get(unit.ID, CounterOverchargePending, 0) > 0 {
			state.Del(unit.ID, CounterOverchargePending)
			state.Set(unit.ID, CounterOverchargeLock, 1)
		}
	}

	return state
}

// endTurn applique les transitions de fin de tour pour le joueur donné et
// marque un point de contrôle s'il tient la zone centrale de façon exclusive,
// selon les CaptureRules en vigueur.
//   - la Suppression (« une seule action à son prochain tour ») expire à la
//     fin du tour du joueur affecté ;
//   - le verrou de Surcharge (« ne pourra pas attaquer lors de son prochain
//     tour ») expire de même.
func endTurn(state GameState, playerID PlayerID) GameState {
	for _, unit := range state.Units {
		if unit.OwnerID != playerID {
			continue
		}
		state.Del(unit.ID, CounterSuppressed)
		state.Del(unit.ID, CounterOverchargeLock)
	}

	state.TurnsPlayed[playerID] = state.TurnsPlayed[playerID] + 1

	if controlsObjective(state, playerID) &&
		state.TurnsPlayed[playerID] > state.Rules.HoldOffRounds {
		state.ControlPoints[playerID] = state.ControlPoints[playerID] + 1

		if state.Rules.ContestSteals {
			opponent := getOpponentPlayerID(playerID)
			if state.ControlPoints[opponent] > 0 {
				state.ControlPoints[opponent] = state.ControlPoints[opponent] - 1
			}
		}
	}

	return state
}

// controlsObjective : au moins une unité du joueur dans la zone centrale, et
// aucune unité adverse.
func controlsObjective(state GameState, playerID PlayerID) bool {
	mine, theirs := 0, 0
	for _, pos := range ObjectiveZone {
		unitID, occupied := state.Board[pos.String()]
		if !occupied {
			continue
		}
		if state.Units[unitID].OwnerID == playerID {
			mine++
		} else {
			theirs++
		}
	}
	return mine > 0 && theirs == 0
}

func (g *Game) Run() iter.Seq[GameStep] {
	return func(yield func(GameStep) bool) {
		for {
			// Check for maximum turns reached
			if g.turn >= g.maxTurns {
				yield(GameStep{
					Action: nil,
					Player: g.state.CurrentPlayerID,
					Turn:   uint(g.turn),
					IsOver: true,
					Winner: GetWinnerOnTimeout(g.state),
				})
				return
			}

			playerID := g.players[int(g.turn)%len(g.players)]

			g.state = beginTurn(g.state, playerID)

			for range g.state.ActionsLeft {
				g.state.ActionsLeft--

				strategy := g.strategies[playerID]
				action := strategy.NextAction(g.state.Copy(), playerID)

				if action != nil {
					g.state = action.Apply(g.state)
				}

				isOver, winner := isGameOver(g.state)

				keepGoing := yield(GameStep{
					Action: action,
					Player: playerID,
					Turn:   uint(g.turn),
					IsOver: isOver,
					Winner: PlayerID(winner),
				})
				if !keepGoing || isOver {
					return
				}
			}

			g.state = endTurn(g.state, playerID)

			// Victoire par capture d'objectif
			if g.state.ControlPoints[playerID] >= g.state.pointsToWin() {
				yield(GameStep{
					Action: nil,
					Player: playerID,
					Turn:   uint(g.turn),
					IsOver: true,
					Winner: playerID,
				})
				return
			}

			g.turn++
		}
	}
}

func isGameOver(state GameState) (bool, PlayerID) {
	remainingUnits := map[PlayerID]int{}

	for _, u := range state.Units {
		remainingUnits[u.OwnerID] += 1
	}

	if len(remainingUnits) == 1 {
		var winner PlayerID
		for playerID := range remainingUnits {
			winner = playerID
			break
		}

		return true, winner
	}

	return false, -1
}

// GetWinnerOnTimeout départage une partie qui atteint la limite de tours :
// points de contrôle d'abord, santé totale ensuite.
func GetWinnerOnTimeout(s GameState) PlayerID {
	if s.ControlPoints[PlayerOne] != s.ControlPoints[PlayerTwo] {
		if s.ControlPoints[PlayerOne] > s.ControlPoints[PlayerTwo] {
			return PlayerOne
		}
		return PlayerTwo
	}
	return GetHealthWinner(s)
}
