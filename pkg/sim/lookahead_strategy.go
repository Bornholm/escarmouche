package sim

import "math"

// LookaheadStrategy returns a StrategyFunc that uses alpha-beta minimax at the given depth.
// depth=1 looks one action ahead (opponent's response), depth=2 looks two actions ahead, etc.
func LookaheadStrategy(depth int) StrategyFunc {
	return func(state GameState, playerID PlayerID) Action {
		action, _ := alphabeta(state, playerID, true, depth, -math.MaxFloat64, math.MaxFloat64)
		return action
	}
}

// alphabeta implements minimax with alpha-beta pruning.
// Players alternate at each depth level (A→B→A→B), approximating the 2-slot-per-turn structure.
func alphabeta(state GameState, maximizingPlayer PlayerID, isMaximizing bool, depth int, alpha, beta float64) (Action, float64) {
	opponent := getOpponentPlayerID(maximizingPlayer)

	// Terminal state: check if either side has been wiped out
	myUnits, opponentUnits := 0, 0
	for _, u := range state.Units {
		if u.OwnerID == maximizingPlayer {
			myUnits++
		} else {
			opponentUnits++
		}
	}
	if myUnits == 0 {
		return nil, -1000.0
	}
	if opponentUnits == 0 {
		return nil, 1000.0
	}

	if depth == 0 {
		return nil, evaluateState(state, maximizingPlayer)
	}

	currentPlayer := maximizingPlayer
	if !isMaximizing {
		currentPlayer = opponent
	}

	actions := sortActionsForPruning(getAllValidActionsForPlayer(state, currentPlayer))
	if len(actions) == 0 {
		return nil, evaluateState(state, maximizingPlayer)
	}

	var bestAction Action

	if isMaximizing {
		bestScore := -math.MaxFloat64
		for _, action := range actions {
			newState := action.Apply(state.Copy())
			_, score := alphabeta(newState, maximizingPlayer, false, depth-1, alpha, beta)
			if score > bestScore {
				bestScore = score
				bestAction = action
			}
			if score > alpha {
				alpha = score
			}
			if beta <= alpha {
				break
			}
		}
		return bestAction, bestScore
	}

	// Minimizing
	bestScore := math.MaxFloat64
	for _, action := range actions {
		newState := action.Apply(state.Copy())
		_, score := alphabeta(newState, maximizingPlayer, true, depth-1, alpha, beta)
		if score < bestScore {
			bestScore = score
			bestAction = action
		}
		if score < beta {
			beta = score
		}
		if beta <= alpha {
			break
		}
	}
	return bestAction, bestScore
}

// getAllValidActionsForPlayer collects all valid actions across all units owned by playerID.
func getAllValidActionsForPlayer(state GameState, playerID PlayerID) []Action {
	actions := make([]Action, 0)
	for _, unit := range getControllableUnits(state, playerID) {
		actions = append(actions, getValidActions(state, unit)...)
	}
	return actions
}

// sortActionsForPruning puts attacks and abilities before moves so alpha-beta prunes more.
func sortActionsForPruning(actions []Action) []Action {
	sorted := make([]Action, 0, len(actions))
	for _, a := range actions {
		if a.Type() == ActionAttack || a.Type() == ActionAbility {
			sorted = append(sorted, a)
		}
	}
	for _, a := range actions {
		if a.Type() == ActionMove {
			sorted = append(sorted, a)
		}
	}
	return sorted
}
