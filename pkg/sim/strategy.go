package sim

import (
	"math"
)

type Strategy interface {
	NextAction(state GameState, playerID PlayerID) Action
}

type StrategyFunc func(state GameState, playerID PlayerID) Action

func (fn StrategyFunc) NextAction(state GameState, playerID PlayerID) Action {
	return fn(state, playerID)
}

func DefaultStrategy(state GameState, playerID PlayerID) Action {
	return findBestAction(state, playerID)
}

func findBestAction(state GameState, playerID PlayerID) Action {
	var bestAction Action
	bestScore := -1e9

	possibleUnits := getControllableUnits(state, playerID)

	for _, unit := range possibleUnits {
		possibleActions := getValidActions(state, unit)

		for _, action := range possibleActions {
			futureState := action.Apply(state.Copy())
			score := evaluateState(futureState, playerID)

			if score > bestScore {
				bestScore = score
				bestAction = action
			}
		}
	}

	return bestAction
}

func getControllableUnits(state GameState, playerID PlayerID) []*PlayerUnit {
	units := make([]*PlayerUnit, 0)

	for _, u := range state.Units {
		if u.OwnerID == playerID {
			units = append(units, u)
		}
	}

	return units
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

func getPossibleMoves(state GameState, unit *PlayerUnit) []Action {
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
			moveAction := NewMoveAction(unit.ID, targetPos)

			moves = append(moves, moveAction)
		}
	}

	return moves
}

func getPossibleAttacks(state GameState, unit *PlayerUnit) []Action {
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

			attackAction := NewAttackAction(unit.ID, targetUnitID)

			attacks = append(attacks, attackAction)
		}
	}

	return attacks
}

func getValidActions(state GameState, unit *PlayerUnit) []Action {
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
