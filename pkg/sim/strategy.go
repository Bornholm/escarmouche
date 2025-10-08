package sim

type Strategy interface {
	NextAction(state GameState, playerID PlayerID) Action
}

type StrategyFunc func(state GameState, playerID PlayerID) Action

func (fn StrategyFunc) NextAction(state GameState, playerID PlayerID) Action {
	return fn(state, playerID)
}

func DefaultStrategy(state GameState, playerID PlayerID) Action {
	return FuzzyStrategy(state, playerID)
}

// LegacyStrategy is the original simple strategy for comparison
func LegacyStrategy(state GameState, playerID PlayerID) Action {
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
			myTotalHealth += state.Get(unit.ID, CounterHealth, 0)
			myTotalHealth += state.Get(unit.ID, CounterDefensiveStance, 0)
		} else {
			opponentTotalHealth += state.Get(unit.ID, CounterHealth, 0)
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

// Helper function to determine if a unit is providing cover
func isProvidingCover(coverUnit, protectedUnit, enemyUnit Position) bool {
	// Check if cover unit is roughly between protected unit and enemy
	distCoverToProtected := distance(coverUnit, protectedUnit)
	distCoverToEnemy := distance(coverUnit, enemyUnit)
	distProtectedToEnemy := distance(protectedUnit, enemyUnit)

	// Cover unit should be closer to enemy than protected unit
	// and the total distance should be roughly equal to direct distance
	return distCoverToEnemy < distProtectedToEnemy &&
		(distCoverToProtected+distCoverToEnemy) <= (distProtectedToEnemy+1.5)
}

// Helper function to get opponent player ID
func getOpponentPlayerID(playerID PlayerID) PlayerID {
	if playerID == PlayerOne {
		return PlayerTwo
	}
	return PlayerOne
}
