package sim

import (
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
)

// FuzzyStrategy implements a more human-like AI using fuzzy logic
func FuzzyStrategy(state GameState, playerID PlayerID) Action {
	return findBestFuzzyAction(state, playerID)
}

// findBestFuzzyAction uses fuzzy logic to make more human-like decisions
func findBestFuzzyAction(state GameState, playerID PlayerID) Action {
	possibleUnits := getControllableUnits(state, playerID)
	if len(possibleUnits) == 0 {
		return nil
	}

	// Evaluate each unit's strategic context and find the best action
	var bestAction Action
	bestScore := -1e9

	for _, unit := range possibleUnits {
		// Calculate strategic context for this unit
		context := calculateStrategicContext(state, unit, playerID)

		// Get fuzzy strategic decision
		decision, err := EvaluateStrategy(context)
		if err != nil {
			// Fallback to simple evaluation if fuzzy logic fails
			continue
		}

		// Get possible actions for this unit
		possibleActions := getValidActions(state, unit)

		// Evaluate each action using fuzzy-influenced scoring
		for _, action := range possibleActions {
			futureState := action.Apply(state.Copy())
			score := evaluateFuzzyAction(futureState, action, unit, decision, playerID)

			// Add some randomness to make decisions less predictable (more human-like)
			randomFactor := 1.0 + (rand.Float64()-0.5)*0.2 // ±10% randomness
			score *= randomFactor

			if score > bestScore {
				bestScore = score
				bestAction = action
			}
		}
	}

	return bestAction
}

// calculateStrategicContext analyzes the tactical situation for a unit
func calculateStrategicContext(state GameState, unit *PlayerUnit, playerID PlayerID) StrategicContext {
	// Calculate health ratio
	currentHealth := state.Get(unit.ID, CounterHealth, unit.Stats.Health)
	healthRatio := float64(currentHealth) / float64(unit.Stats.Health)

	// Find nearest enemy and calculate distance
	unitPos := state.Positions[unit.ID]
	minDistance := 100.0
	maxEnemyPower := 0

	for _, enemyUnit := range state.Units {
		if enemyUnit.OwnerID != playerID {
			enemyPos := state.Positions[enemyUnit.ID]
			dist := distance(unitPos, enemyPos)
			if dist < minDistance {
				minDistance = dist
			}
			if enemyUnit.Stats.Power > maxEnemyPower {
				maxEnemyPower = enemyUnit.Stats.Power
			}
		}
	}

	// Calculate enemy threat
	enemyThreat := CalculateEnemyThreat(currentHealth, maxEnemyPower, minDistance)

	// Calculate unit value
	unitValue := CalculateUnitValue(unit.Stats, unit.Abilities, core.DefaultCosts)

	return StrategicContext{
		HealthRatio:     healthRatio,
		DistanceToEnemy: minDistance,
		EnemyThreat:     enemyThreat,
		UnitValue:       unitValue,
	}
}

// evaluateFuzzyAction scores an action based on fuzzy strategic preferences
func evaluateFuzzyAction(futureState GameState, action Action, unit *PlayerUnit, decision *StrategicDecision, playerID PlayerID) float64 {
	// Start with base evaluation
	baseScore := evaluateState(futureState, playerID)

	// Apply fuzzy modifiers based on action type and strategic decision
	switch action.Type() {
	case ActionAttack:
		return evaluateAttackAction(futureState, action.(*AttackAction), unit, decision, playerID, baseScore)
	case ActionMove:
		return evaluateMoveAction(futureState, action.(*MoveAction), unit, decision, playerID, baseScore)
	case ActionAbility:
		return evaluateAbilityAction(futureState, action.(*AbilityAction), unit, decision, playerID, baseScore)
	}

	return baseScore
}

// evaluateAttackAction applies fuzzy logic to attack actions
func evaluateAttackAction(futureState GameState, action *AttackAction, unit *PlayerUnit, decision *StrategicDecision, playerID PlayerID, baseScore float64) float64 {
	score := baseScore

	// Aggressive units prefer attacking
	aggressionBonus := decision.Aggression * 50.0
	score += aggressionBonus

	// Risk-tolerant units are more likely to attack even when vulnerable
	if decision.RiskTolerance > 0.6 {
		score += 20.0
	}

	// Defensive units avoid risky attacks
	if decision.Aggression < 0.4 {
		// Check if this attack puts the unit in danger
		unitPos := futureState.Positions[unit.ID]
		enemyCount := countNearbyEnemies(futureState, unitPos, playerID, 2.0)
		if enemyCount > 1 {
			score -= 30.0 // Penalty for risky attacks when being defensive
		}
	}

	// Bonus for attacking when we have positioning advantage
	if decision.PositioningPreference > 0.6 {
		score += 15.0
	}

	return score
}

// evaluateMoveAction applies fuzzy logic to movement actions
func evaluateMoveAction(futureState GameState, action *MoveAction, unit *PlayerUnit, decision *StrategicDecision, playerID PlayerID, baseScore float64) float64 {
	score := baseScore

	unitPos := futureState.Positions[unit.ID]

	// Calculate movement direction relative to enemies
	avgEnemyPos := calculateAverageEnemyPosition(futureState, playerID)
	if avgEnemyPos != nil {
		distanceToEnemies := distance(unitPos, *avgEnemyPos)

		// Apply positioning preference
		if decision.PositioningPreference > 0.6 {
			// Prefer advancing toward enemies
			if distanceToEnemies < 6.0 {
				score += 25.0
			}
		} else if decision.PositioningPreference < 0.4 {
			// Prefer retreating from enemies
			if distanceToEnemies > 4.0 {
				score += 25.0
			}
		}
	}

	// Risk-averse units prefer safer positions
	if decision.RiskTolerance < 0.4 {
		enemyCount := countNearbyEnemies(futureState, unitPos, playerID, 3.0)
		if enemyCount == 0 {
			score += 20.0 // Bonus for moving to safe positions
		}
	}

	// Aggressive units prefer positions that enable attacks
	if decision.Aggression > 0.6 {
		attackTargets := countNearbyEnemies(futureState, unitPos, playerID, float64(unit.Stats.Range))
		score += float64(attackTargets) * 15.0
	}

	return score
}

// evaluateAbilityAction applies fuzzy logic to ability actions
func evaluateAbilityAction(futureState GameState, action *AbilityAction, unit *PlayerUnit, decision *StrategicDecision, playerID PlayerID, baseScore float64) float64 {
	score := baseScore

	// Different abilities get different bonuses based on strategic preferences
	abilityID := action.String()

	if contains(abilityID, "defensive-stance") {
		// Defensive units prefer defensive abilities
		if decision.Aggression < 0.5 {
			score += 30.0
		}
		// Risk-averse units also prefer defensive abilities
		if decision.RiskTolerance < 0.4 {
			score += 20.0
		}
	}

	if contains(abilityID, "charge") || contains(abilityID, "energy-trait") {
		// Aggressive units prefer offensive abilities
		if decision.Aggression > 0.6 {
			score += 35.0
		}
		// Bold units are more likely to use risky abilities
		if decision.RiskTolerance > 0.6 {
			score += 25.0
		}
	}

	return score
}

// Helper functions

func calculateAverageEnemyPosition(state GameState, playerID PlayerID) *Position {
	var totalX, totalY, count int

	for _, unit := range state.Units {
		if unit.OwnerID != playerID {
			pos := state.Positions[unit.ID]
			totalX += pos.X
			totalY += pos.Y
			count++
		}
	}

	if count == 0 {
		return nil
	}

	return &Position{
		X: totalX / count,
		Y: totalY / count,
	}
}

func countNearbyEnemies(state GameState, pos Position, playerID PlayerID, radius float64) int {
	count := 0
	for _, unit := range state.Units {
		if unit.OwnerID != playerID {
			enemyPos := state.Positions[unit.ID]
			if distance(pos, enemyPos) <= radius {
				count++
			}
		}
	}
	return count
}

func contains(str, substr string) bool {
	return len(str) >= len(substr) && str[:len(substr)] == substr ||
		len(str) > len(substr) && str[len(str)-len(substr):] == substr ||
		(len(str) > len(substr) && findSubstring(str, substr))
}

func findSubstring(str, substr string) bool {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
