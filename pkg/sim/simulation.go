package sim

import (
	"math"
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

type Simulation struct {
	turn    int
	players []PlayerID
	state   GameState
}

func (s *Simulation) State() *GameState {
	return &s.state
}

func (s *Simulation) Turn() int {
	return s.turn
}

func (s *Simulation) Next() ([]Action, bool, PlayerID) {
	defer func() {
		s.turn++
	}()

	playerID := s.players[s.turn%len(s.players)]

	s.state.CurrentPlayerID = PlayerID(playerID)
	s.state.ActionsLeft = 2

	s.state.Attacks = map[UnitID]int{}

	actions := make([]Action, 0)

	for range s.state.ActionsLeft {
		s.state.ActionsLeft--
		action := findBestAction(s.state, playerID)
		s.state = applyAction(s.state.Copy(), action)

		actions = append(actions, action)

		if isOver, winner := isGameOver(s.state); isOver {
			return actions, true, PlayerID(winner)
		}
	}

	return actions, false, -1
}

func NewSimulation(player1 []core.Stats, player2 []core.Stats) *Simulation {
	gameState := GameState{
		Healths:         map[UnitID]int{},
		Board:           map[string]UnitID{},
		Positions:       map[UnitID]Position{},
		Units:           map[UnitID]*Unit{},
		CurrentPlayerID: 0,
	}

	var unitID UnitID = 0

	initSquad := func(playerID PlayerID, row int, units []core.Stats) {
		availablePositions := []int{0, 1, 2, 3, 4, 5, 6, 7}
		rand.Shuffle(len(availablePositions), func(i, j int) {
			availablePositions[i], availablePositions[j] = availablePositions[j], availablePositions[i]
		})
		for i, u := range units {
			pos := Position{X: availablePositions[i], Y: row}
			unit := &Unit{
				ID:      unitID,
				OwnerID: playerID,
				Stats: UnitStats{
					Health: u.Health,
					Reach:  u.Reach,
					Attack: u.Attack,
					Move:   u.Move,
				},
			}

			gameState.Healths[unit.ID] = u.Health
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

	return &Simulation{
		state:   gameState,
		players: players,
		turn:    0,
	}
}

func evaluateState(state GameState, playerID PlayerID) float64 {
	score := 0.0

	myTotalHealth := 0
	opponentTotalHealth := 0

	for _, unit := range state.Units {
		if unit.OwnerID == playerID {
			myTotalHealth += state.Healths[unit.ID]
		} else {
			opponentTotalHealth += state.Healths[unit.ID]
		}
	}

	// Primary score based on health difference (favors attacks)
	score = float64(myTotalHealth - opponentTotalHealth)

	// Add positional bonus: reward moving closer to enemies
	positionBonus := 0.0
	for _, unit := range state.Units {
		if unit.OwnerID == playerID {
			minDistanceToEnemy := 100.0
			for _, enemyUnit := range state.Units {
				if enemyUnit.OwnerID != playerID {
					dist := distance(state.Positions[unit.ID], state.Positions[enemyUnit.ID])
					if dist < minDistanceToEnemy {
						minDistanceToEnemy = dist
					}
				}
			}
			// Closer to enemies is better (lower distance = higher bonus)
			if minDistanceToEnemy < 100.0 {
				positionBonus += (10.0 - minDistanceToEnemy) * 0.1
			}
		}
	}

	score += positionBonus

	return score
}

func findBestAction(state GameState, playerID PlayerID) Action {
	var bestAction Action
	bestScore := -1e9

	possibleUnits := getControllableUnits(state, playerID)

	for _, unit := range possibleUnits {
		possibleActions := getValidActions(state, unit)

		for _, action := range possibleActions {
			futureState := applyAction(state.Copy(), action)
			score := evaluateState(futureState, playerID)

			if score > bestScore {
				bestScore = score
				bestAction = action
			}
		}
	}

	return bestAction
}

func getControllableUnits(state GameState, playerID PlayerID) []*Unit {
	units := make([]*Unit, 0)

	for _, u := range state.Units {
		if u.OwnerID == playerID {
			units = append(units, u)
		}
	}

	return units
}

func applyAction(state GameState, action Action) GameState {
	switch action.Type {
	case ActionMove:
		return applyMoveAction(state, action)

	case ActionAttack:
		return applyAttackAction(state, action)

	default:
		panic(errors.Errorf("unknown action type '%d'", action.Type))
	}
}

func applyMoveAction(state GameState, action Action) GameState {
	unit := state.Units[action.UnitID]

	delete(state.Board, state.Positions[unit.ID].String())
	state.Positions[unit.ID] = action.TargetPos
	state.Board[action.TargetPos.String()] = unit.ID

	return state
}

func applyAttackAction(state GameState, action Action) GameState {
	unit := state.Units[action.UnitID]

	state.Healths[action.TargetID] -= unit.Stats.Attack

	if state.Healths[action.TargetID] <= 0 {
		delete(state.Healths, action.TargetID)
		delete(state.Board, state.Positions[action.TargetID].String())
		delete(state.Positions, action.TargetID)
		delete(state.Units, action.TargetID)
	}

	return state
}

func getPossibleMoves(state GameState, unit *Unit) []Action {
	moves := make([]Action, 0)

	// Get all positions within movement range using Manhattan distance
	for dx := -unit.Stats.Move; dx <= unit.Stats.Move; dx++ {
		for dy := -unit.Stats.Move; dy <= unit.Stats.Move; dy++ {
			// Skip the current position
			if dx == 0 && dy == 0 {
				continue
			}

			// Check if the movement distance is within the unit's move range
			manhattanDistance := abs(dx) + abs(dy)
			if manhattanDistance > unit.Stats.Move {
				continue
			}

			targetPos := Position{
				X: state.Positions[unit.ID].X + dx,
				Y: state.Positions[unit.ID].Y + dy,
			}

			// Check if target position is within board bounds (8x8 board)
			if targetPos.X < 0 || targetPos.X >= 8 || targetPos.Y < 0 || targetPos.Y >= 8 {
				continue
			}

			// Check if target position is not occupied
			if _, exists := state.Board[targetPos.String()]; exists {
				continue
			}

			// Create move action
			moveAction := Action{
				Type:      ActionMove,
				UnitID:    unit.ID,
				TargetPos: targetPos,
			}

			moves = append(moves, moveAction)
		}
	}

	return moves
}

func getPossibleAttacks(state GameState, unit *Unit) []Action {
	attacks := make([]Action, 0)

	unitPos := state.Positions[unit.ID]

	for dx := -unit.Stats.Reach; dx <= unit.Stats.Reach; dx++ {
		for dy := -unit.Stats.Reach; dy <= unit.Stats.Reach; dy++ {
			if dx == 0 && dy == 0 {
				continue
			}

			targetPos := Position{
				X: state.Positions[unit.ID].X + dx,
				Y: state.Positions[unit.ID].Y + dy,
			}

			if targetPos.X < 0 || targetPos.X >= 8 || targetPos.Y < 0 || targetPos.Y >= 8 {
				continue
			}

			targetUnitID, exists := state.Board[targetPos.String()]
			if !exists || state.Units[targetUnitID].OwnerID == unit.OwnerID {
				continue
			}

			dist := distance(unitPos, targetPos)
			if int(dist) > unit.Stats.Reach {
				continue
			}

			attackAction := Action{
				Type:      ActionAttack,
				UnitID:    unit.ID,
				TargetPos: targetPos,
				TargetID:  targetUnitID,
			}

			attacks = append(attacks, attackAction)
		}
	}

	return attacks
}

func getValidActions(state GameState, unit *Unit) []Action {
	actions := make([]Action, 0)

	// Add possible moves
	moves := getPossibleMoves(state, unit)
	actions = append(actions, moves...)

	if total, exists := state.Attacks[unit.ID]; !exists || total == 0 {
		attacks := getPossibleAttacks(state, unit)
		actions = append(actions, attacks...)
	}

	return actions
}

// Helper function to calculate absolute value
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// Helper function to calculate Manhattan distance between two positions
func distance(pos1, pos2 Position) float64 {
	return math.Sqrt(
		math.Pow(float64(pos1.X-pos2.X), 2) +
			math.Pow(float64(pos1.Y-pos2.Y), 2),
	)
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
