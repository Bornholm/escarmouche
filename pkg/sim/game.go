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
		counters:  map[UnitID]map[string]int{},
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
					Winner: GetHealthWinner(g.state),
				})
				return
			}

			playerID := g.players[int(g.turn)%len(g.players)]

			g.state.CurrentPlayerID = PlayerID(playerID)
			g.state.ActionsLeft = 2

			g.state.DelAll(CounterRoundAttacks)

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
