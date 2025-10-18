package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestFuzzyStrategyBehavior(t *testing.T) {
	// Create test units with different characteristics
	aggressiveUnit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 5,
				Range:  2,
				Move:   3,
				Power:  4,
			},
			Abilities: []core.Ability{
				{ID: "00000-charge", Cost: 2.0},
			},
		},
	}

	defensiveUnit := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2, // Low health should make it defensive
				Range:  1,
				Move:   2,
				Power:  2,
			},
			Abilities: []core.Ability{
				{ID: "00002-defensive-stance", Cost: 1.0},
			},
		},
	}

	enemyUnit := &PlayerUnit{
		ID:      3,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Range:  1,
				Move:   2,
				Power:  3,
			},
		},
	}

	// Test scenario: healthy unit vs damaged unit behavior
	t.Run("HealthyUnitShouldBeAggressive", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 2, Y: 2}, 3: {X: 4, Y: 2}},
			Board:           map[string]UnitID{"2,2": 1, "4,2": 3},
			Units:           map[UnitID]*PlayerUnit{1: aggressiveUnit, 3: enemyUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		// Set full health for aggressive unit
		state.Set(1, CounterHealth, 5)
		state.Set(3, CounterHealth, 3)

		// Calculate strategic context for healthy unit
		context := calculateStrategicContext(state, aggressiveUnit, PlayerOne)

		// Healthy unit should have high health ratio
		if context.HealthRatio < 0.8 {
			t.Errorf("Expected high health ratio for healthy unit, got %.2f", context.HealthRatio)
		}

		// Get strategic decision
		decision, err := EvaluateStrategy(context)
		if err != nil {
			t.Fatalf("Failed to evaluate strategy: %v", err)
		}

		// Healthy unit should be more aggressive
		if decision.Aggression < 0.5 {
			t.Errorf("Expected healthy unit to be aggressive, got aggression %.2f", decision.Aggression)
		}

		t.Logf("Healthy unit - Health: %.2f, Aggression: %.2f, Risk: %.2f, Positioning: %.2f",
			context.HealthRatio, decision.Aggression, decision.RiskTolerance, decision.PositioningPreference)
	})

	t.Run("DamagedUnitShouldBeDefensive", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{2: {X: 2, Y: 2}, 3: {X: 3, Y: 2}},
			Board:           map[string]UnitID{"2,2": 2, "3,2": 3},
			Units:           map[UnitID]*PlayerUnit{2: defensiveUnit, 3: enemyUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		// Set low health for defensive unit
		state.Set(2, CounterHealth, 1) // Very low health
		state.Set(3, CounterHealth, 3)

		// Calculate strategic context for damaged unit
		context := calculateStrategicContext(state, defensiveUnit, PlayerOne)

		// Damaged unit should have low health ratio
		if context.HealthRatio > 0.6 {
			t.Errorf("Expected low health ratio for damaged unit, got %.2f", context.HealthRatio)
		}

		// Get strategic decision
		decision, err := EvaluateStrategy(context)
		if err != nil {
			t.Fatalf("Failed to evaluate strategy: %v", err)
		}

		// Damaged unit should be more defensive
		if decision.Aggression > 0.5 {
			t.Errorf("Expected damaged unit to be defensive, got aggression %.2f", decision.Aggression)
		}

		t.Logf("Damaged unit - Health: %.2f, Aggression: %.2f, Risk: %.2f, Positioning: %.2f",
			context.HealthRatio, decision.Aggression, decision.RiskTolerance, decision.PositioningPreference)
	})

	t.Run("FuzzyStrategyVsLegacyStrategy", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 1, Y: 1}, 2: {X: 2, Y: 1}, 3: {X: 6, Y: 6}},
			Board:           map[string]UnitID{"1,1": 1, "2,1": 2, "6,6": 3},
			Units:           map[UnitID]*PlayerUnit{1: aggressiveUnit, 2: defensiveUnit, 3: enemyUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		state.Set(1, CounterHealth, 5)
		state.Set(2, CounterHealth, 1)
		state.Set(3, CounterHealth, 3)

		// Test fuzzy strategy
		fuzzyAction := FuzzyStrategy(state.Copy(), PlayerOne)
		legacyAction := LegacyStrategy(state.Copy(), PlayerOne)

		// Both should return valid actions
		if fuzzyAction == nil {
			t.Error("Fuzzy strategy returned nil action")
		}
		if legacyAction == nil {
			t.Error("Legacy strategy returned nil action")
		}

		if fuzzyAction != nil && legacyAction != nil {
			t.Logf("Fuzzy strategy chose: %s", fuzzyAction.String())
			t.Logf("Legacy strategy chose: %s", legacyAction.String())

			// Actions might be different due to fuzzy logic and randomness
			// This is expected and shows the human-like variability
		}
	})
}

func TestStrategicContextCalculation(t *testing.T) {
	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 4,
				Range:  2,
				Move:   2,
				Power:  3,
			},
			Abilities: []core.Ability{
				{ID: "00001-energy-trait", Cost: 1.5},
			},
		},
	}

	enemy := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Range:  1,
				Move:   2,
				Power:  4,
			},
		},
	}

	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 2, Y: 2}, 2: {X: 4, Y: 3}},
		Board:           map[string]UnitID{"2,2": 1, "4,3": 2},
		Units:           map[UnitID]*PlayerUnit{1: unit, 2: enemy},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	state.Set(1, CounterHealth, 2) // Half health
	state.Set(2, CounterHealth, 3)

	context := calculateStrategicContext(state, unit, PlayerOne)

	// Verify context calculation
	expectedHealthRatio := 0.5 // 2/4
	if abs(int(context.HealthRatio*100-expectedHealthRatio*100)) > 1 {
		t.Errorf("Expected health ratio %.2f, got %.2f", expectedHealthRatio, context.HealthRatio)
	}

	// Distance should be calculated correctly
	expectedDistance := distance(Position{X: 2, Y: 2}, Position{X: 4, Y: 3})
	if abs(int(context.DistanceToEnemy*100-expectedDistance*100)) > 1 {
		t.Errorf("Expected distance %.2f, got %.2f", expectedDistance, context.DistanceToEnemy)
	}

	// Enemy threat should be > 0 since enemy is close and has high attack
	if context.EnemyThreat <= 0 {
		t.Errorf("Expected enemy threat > 0, got %.2f", context.EnemyThreat)
	}

	// Unit value should be > 0
	if context.UnitValue <= 0 {
		t.Errorf("Expected unit value > 0, got %.2f", context.UnitValue)
	}

	t.Logf("Strategic context - Health: %.2f, Distance: %.2f, Threat: %.2f, Value: %.2f",
		context.HealthRatio, context.DistanceToEnemy, context.EnemyThreat, context.UnitValue)
}
