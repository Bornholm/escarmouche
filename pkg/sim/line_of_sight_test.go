package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestLineOfSight(t *testing.T) {
	// Create test units
	attackerUnit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Range:  3,
				Move:   2,
				Power:  2,
			},
		},
	}

	targetUnit := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2,
				Range:  1,
				Move:   1,
				Power:  1,
			},
		},
	}

	blockingUnit := &PlayerUnit{
		ID:      3,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 1,
				Range:  1,
				Move:   1,
				Power:  1,
			},
		},
	}

	// Test case 1: Clear line of sight
	t.Run("Clear line of sight", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 0, Y: 0}, 2: {X: 2, Y: 0}},
			Board:           map[string]UnitID{"0,0": 1, "2,0": 2},
			Units:           map[UnitID]*PlayerUnit{1: attackerUnit, 2: targetUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		reachable := getReachableOpponentUnits(state, PlayerOne, Position{X: 0, Y: 0}, 3)

		if len(reachable) != 1 {
			t.Errorf("Expected 1 reachable unit with clear line of sight, got %d", len(reachable))
		}

		if len(reachable) > 0 && reachable[0] != 2 {
			t.Errorf("Expected unit 2 to be reachable, got unit %d", reachable[0])
		}
	})

	// Test case 2: Blocked line of sight
	t.Run("Blocked line of sight", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 0, Y: 0}, 2: {X: 2, Y: 0}, 3: {X: 1, Y: 0}},
			Board:           map[string]UnitID{"0,0": 1, "2,0": 2, "1,0": 3},
			Units:           map[UnitID]*PlayerUnit{1: attackerUnit, 2: targetUnit, 3: blockingUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		reachable := getReachableOpponentUnits(state, PlayerOne, Position{X: 0, Y: 0}, 3)

		// Should only find the blocking unit (unit 3), not the target behind it (unit 2)
		expectedRangeable := []UnitID{3}
		if len(reachable) != len(expectedRangeable) {
			t.Errorf("Expected %d reachable units with blocked line of sight, got %d", len(expectedRangeable), len(reachable))
		}

		for _, expected := range expectedRangeable {
			found := false
			for _, actual := range reachable {
				if actual == expected {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("Expected unit %d to be reachable, but it wasn't found", expected)
			}
		}
	})

	// Test case 3: Diagonal line of sight with blocking unit
	t.Run("Diagonal blocked line of sight", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 0, Y: 0}, 2: {X: 2, Y: 2}, 3: {X: 1, Y: 1}},
			Board:           map[string]UnitID{"0,0": 1, "2,2": 2, "1,1": 3},
			Units:           map[UnitID]*PlayerUnit{1: attackerUnit, 2: targetUnit, 3: blockingUnit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		reachable := getReachableOpponentUnits(state, PlayerOne, Position{X: 0, Y: 0}, 3)

		// Should only find the blocking unit (unit 3), not the target behind it (unit 2)
		expectedRangeable := []UnitID{3}
		if len(reachable) != len(expectedRangeable) {
			t.Errorf("Expected %d reachable units with diagonal blocked line of sight, got %d", len(expectedRangeable), len(reachable))
		}

		for _, expected := range expectedRangeable {
			found := false
			for _, actual := range reachable {
				if actual == expected {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("Expected unit %d to be reachable, but it wasn't found", expected)
			}
		}
	})
}

func TestHasLineOfSight(t *testing.T) {
	// Test clear line of sight
	clearState := GameState{
		Board: map[string]UnitID{},
	}

	if !hasLineOfSight(clearState, Position{X: 0, Y: 0}, Position{X: 2, Y: 2}) {
		t.Error("Expected clear line of sight from (0,0) to (2,2), but got blocked")
	}

	// Test blocked line of sight
	blockedState := GameState{
		Board: map[string]UnitID{
			"1,1": 1, // blocking unit at (1,1)
		},
	}

	if hasLineOfSight(blockedState, Position{X: 0, Y: 0}, Position{X: 2, Y: 2}) {
		t.Error("Expected blocked line of sight from (0,0) to (2,2) with unit at (1,1), but got clear")
	}
}
