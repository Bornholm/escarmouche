package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestEvaluateStateDefensiveActions(t *testing.T) {
	// Create test units
	unit1 := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Reach:  1,
				Move:   2,
				Attack: 2,
			},
		},
	}

	unit2 := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2,
				Reach:  1,
				Move:   2,
				Attack: 2,
			},
		},
	}

	enemyUnit := &PlayerUnit{
		ID:      3,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2,
				Reach:  1,
				Move:   1,
				Attack: 2,
			},
		},
	}

	// Test state without defensive stance
	stateWithoutDefense := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 2, Y: 2}, 2: {X: 3, Y: 2}, 3: {X: 5, Y: 2}},
		Board:           map[string]UnitID{"2,2": 1, "3,2": 2, "5,2": 3},
		Units:           map[UnitID]*PlayerUnit{1: unit1, 2: unit2, 3: enemyUnit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set initial health
	stateWithoutDefense.Set(1, CounterHealth, 3)
	stateWithoutDefense.Set(2, CounterHealth, 2)
	stateWithoutDefense.Set(3, CounterHealth, 2)

	scoreWithoutDefense := evaluateState(stateWithoutDefense, PlayerOne)

	// Test state with defensive stance on unit1
	stateWithDefense := stateWithoutDefense.Copy()
	stateWithDefense.Set(1, CounterDefensiveStance, 1)

	scoreWithDefense := evaluateState(stateWithDefense, PlayerOne)

	// Score with defensive stance should be higher
	if scoreWithDefense <= scoreWithoutDefense {
		t.Errorf("Expected defensive stance to increase score. Without: %.2f, With: %.2f",
			scoreWithoutDefense, scoreWithDefense)
	}

	t.Logf("Score without defensive stance: %.2f", scoreWithoutDefense)
	t.Logf("Score with defensive stance: %.2f", scoreWithDefense)
	t.Logf("Defensive bonus: %.2f", scoreWithDefense-scoreWithoutDefense)
}
