package sim

import (
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
)

type Unit struct {
	Stats     core.Stats
	Abilities []core.Ability
}

type Simulation struct {
	turn       int
	players    []PlayerID
	strategies map[PlayerID]StrategyFunc
	state      GameState
}

func NewSimulation(player1 []Unit, player2 []Unit, funcs ...OptionFunc) *Simulation {
	opts := NewOptions(funcs...)

	gameState := GameState{
		Healths:   map[UnitID]int{},
		Board:     map[string]UnitID{},
		Positions: map[UnitID]Position{},
		Units:     map[UnitID]*PlayerUnit{},
	}

	var unitID UnitID = 0

	initSquad := func(playerID PlayerID, row int, units []Unit) {
		availablePositions := []int{0, 1, 2, 3, 4, 5, 6, 7}
		rand.Shuffle(len(availablePositions), func(i, j int) {
			availablePositions[i], availablePositions[j] = availablePositions[j], availablePositions[i]
		})
		for i, u := range units {
			pos := Position{X: availablePositions[i], Y: row}
			unit := &PlayerUnit{
				ID:      unitID,
				OwnerID: playerID,
				Unit: Unit{
					Stats: core.Stats{
						Health: u.Stats.Health,
						Reach:  u.Stats.Reach,
						Attack: u.Stats.Attack,
						Move:   u.Stats.Move,
					},
					Abilities: append([]core.Ability{}, u.Abilities...),
				},
			}

			gameState.Healths[unit.ID] = u.Stats.Health
			gameState.Board[pos.String()] = unit.ID
			gameState.Positions[unit.ID] = pos
			gameState.Units[unitID] = unit

			unitID++
		}
	}

	initSquad(PlayerOne, 0, player1)
	initSquad(PlayerTwo, 7, player2)

	players := []PlayerID{PlayerOne, PlayerTwo}

	rand.Shuffle(len(players), func(i, j int) {
		players[i], players[j] = players[j], players[i]
	})

	gameState.CurrentPlayerID = players[0]

	return &Simulation{
		state:      gameState,
		players:    players,
		turn:       0,
		strategies: opts.Strategies,
	}
}

func (s *Simulation) State() *GameState {
	return &s.state
}

func (s *Simulation) Turn() int {
	return s.turn
}

func (s *Simulation) Next() ([]Action, bool, PlayerID) {
	playerID := s.players[s.turn%len(s.players)]

	s.state.CurrentPlayerID = PlayerID(playerID)
	s.state.ActionsLeft = 2

	s.state.Attacks = map[UnitID]int{}

	actions := make([]Action, 0)

	for range s.state.ActionsLeft {
		s.state.ActionsLeft--

		strategy := s.strategies[playerID]
		action := strategy.NextAction(s.state.Copy(), playerID)
		s.state = action.Apply(s.state)

		actions = append(actions, action)

		if isOver, winner := isGameOver(s.state); isOver {
			return actions, true, PlayerID(winner)
		}
	}

	s.turn++

	return actions, false, -1
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
