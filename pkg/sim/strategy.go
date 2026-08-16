package sim

type Strategy interface {
	NextAction(state GameState, playerID PlayerID) Action
}

type StrategyFunc func(state GameState, playerID PlayerID) Action

func (fn StrategyFunc) NextAction(state GameState, playerID PlayerID) Action {
	return fn(state, playerID)
}

func DefaultStrategy(state GameState, playerID PlayerID) Action {
	return LookaheadStrategy(2)(state, playerID)
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

// evaluateState note un état du point de vue de playerID.
//
// Hiérarchie des poids, du dominant au marginal :
//  1. points de contrôle de la zone centrale (la condition de victoire) ;
//  2. matériel — santé et menace résiduelle des unités ;
//  3. position — présence dans la zone, distance de combat adaptée au profil
//     (les tireurs veulent tenir leur portée SANS être à portée adverse,
//     l'ancienne évaluation poussait tout le monde au corps-à-corps, snipers
//     compris) ;
//  4. exposition — pénalité quand une unité fragile est dans la zone de
//     mise à mort d'un ennemi.
func evaluateState(state GameState, playerID PlayerID) float64 {
	opponent := getOpponentPlayerID(playerID)

	score := float64(state.ControlPoints[playerID]-state.ControlPoints[opponent]) * 60.0

	for _, unit := range state.Units {
		sign := 1.0
		if unit.OwnerID != playerID {
			sign = -1.0
		}

		health := float64(state.Get(unit.ID, CounterHealth, 0))
		threat := float64(unit.Stats.Power)*0.8 +
			float64(unit.Stats.Range)*0.3 +
			float64(unit.Stats.Move)*0.3

		score += sign * (health + threat)

		// Une Posture Défensive active vaut presque un point de vie : elle
		// annulera le prochain point de dégât reçu.
		if state.Get(unit.ID, CounterDefensiveStance, 0) > 0 {
			score += sign * 0.8
		}

		pos := state.Positions[unit.ID]

		// Contrôle de la zone : y être vaut cher, s'en approcher un peu.
		if InObjectiveZone(pos) {
			score += sign * 2.5
		} else {
			score -= sign * objectiveDistance(pos) * 0.15
		}

		// Distance de combat selon le profil.
		nearestDist, nearestEnemy := nearestEnemyFrom(state, unit, pos)
		if nearestEnemy == nil {
			continue
		}
		if unit.Stats.Range > 1 {
			score -= sign * absFloat(nearestDist-float64(unit.Stats.Range)) * 0.2
		} else {
			score -= sign * nearestDist * 0.2
		}

		// Zone de mise à mort : à portée d'un ennemi capable de nous achever.
		if nearestDist <= float64(nearestEnemy.Stats.Range)+float64(nearestEnemy.Stats.Move) &&
			int(health) <= nearestEnemy.Stats.Power {
			score -= sign * 1.5
		}
	}

	return score
}

func nearestEnemyFrom(state GameState, unit *PlayerUnit, from Position) (float64, *PlayerUnit) {
	best := 1e9
	var enemy *PlayerUnit
	for _, other := range state.Units {
		if other.OwnerID == unit.OwnerID {
			continue
		}
		if d := distance(from, state.Positions[other.ID]); d < best {
			best = d
			enemy = other
		}
	}
	return best, enemy
}

func absFloat(v float64) float64 {
	if v < 0 {
		return -v
	}
	return v
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

// GetValidActionsForPlayer returns all valid actions for all controllable units of a player.
func GetValidActionsForPlayer(state GameState, playerID PlayerID) []Action {
	var actions []Action
	for _, unit := range getControllableUnits(state, playerID) {
		actions = append(actions, getValidActions(state, unit)...)
	}
	return actions
}
