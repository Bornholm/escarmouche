package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestDefensiveStanceAbility(t *testing.T) {
	// Create a unit with the Defensive Stance ability
	defensiveStanceAbility := core.Ability{
		ID:          "00002-defensive-stance",
		Label:       core.Text{"en-EN": "Defensive Stance"},
		Description: core.Text{"en-EN": "The next point of damage dealt to this unit is canceled. This effect cannot be stacked multiple times."},
		Cost:        3,
	}

	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Reach:  1,
				Move:   2,
				Attack: 2,
			},
			Abilities: []core.Ability{defensiveStanceAbility},
		},
	}

	// Create an enemy unit
	enemyUnit := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2,
				Reach:  1,
				Move:   1,
				Attack: 2,
			},
			Abilities: []core.Ability{},
		},
	}

	// Create game state
	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 0, Y: 0}, 2: {X: 1, Y: 0}},
		Board:           map[string]UnitID{"0,0": 1, "1,0": 2},
		Units:           map[UnitID]*PlayerUnit{1: unit, 2: enemyUnit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set initial health
	state.Set(1, CounterHealth, 3)
	state.Set(2, CounterHealth, 2)

	// Get possible defensive stance actions
	defensiveActions := getPossibleDefensiveStances(state, unit)

	// Should have defensive stance action available
	if len(defensiveActions) != 1 {
		t.Fatalf("Expected 1 defensive stance action, but got %d", len(defensiveActions))
	}

	// Apply defensive stance
	defensiveAction := defensiveActions[0]
	newState := defensiveAction.Apply(state.Copy())

	// Verify defensive stance is active
	defensiveStance := newState.Get(1, CounterDefensiveStance, 0)
	if defensiveStance != 1 {
		t.Errorf("Expected defensive stance to be active (1), but got %d", defensiveStance)
	}

	// Verify the unit used an ability this round
	roundAbilities := newState.Get(1, CounterRoundAbilities, 0)
	if roundAbilities != 1 {
		t.Errorf("Unit should have used 1 ability this round, but used %d", roundAbilities)
	}

	// Test that defensive stance blocks damage
	// Enemy attacks the unit with defensive stance
	attackAction := NewAttackAction(2, 1)
	finalState := attackAction.Apply(newState)

	// Unit should have taken 1 less damage (2 attack - 1 blocked = 1 damage)
	finalHealth := finalState.Get(1, CounterHealth, 3)
	expectedHealth := 3 - 1 // 3 initial - 1 damage (1 blocked by defensive stance)
	if finalHealth != expectedHealth {
		t.Errorf("Expected unit to have %d health after defensive stance blocked damage, but has %d", expectedHealth, finalHealth)
	}

	// Defensive stance should be consumed
	finalDefensiveStance := finalState.Get(1, CounterDefensiveStance, 0)
	if finalDefensiveStance != 0 {
		t.Errorf("Expected defensive stance to be consumed (0), but got %d", finalDefensiveStance)
	}

	t.Logf("Defensive stance action applied successfully: %s", defensiveAction.String())
}

func TestDefensiveStanceCannotStack(t *testing.T) {
	// Create a unit with the Defensive Stance ability
	defensiveStanceAbility := core.Ability{
		ID:          "00002-defensive-stance",
		Label:       core.Text{"en-EN": "Defensive Stance"},
		Description: core.Text{"en-EN": "The next point of damage dealt to this unit is canceled. This effect cannot be stacked multiple times."},
		Cost:        3,
	}

	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Reach:  1,
				Move:   2,
				Attack: 2,
			},
			Abilities: []core.Ability{defensiveStanceAbility},
		},
	}

	// Create game state with defensive stance already active
	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 0, Y: 0}},
		Board:           map[string]UnitID{"0,0": 1},
		Units:           map[UnitID]*PlayerUnit{1: unit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set defensive stance already active
	state.Set(1, CounterDefensiveStance, 1)

	// Get possible defensive stance actions
	defensiveActions := getPossibleDefensiveStances(state, unit)

	// Should have no defensive stance actions available (cannot stack)
	if len(defensiveActions) != 0 {
		t.Errorf("Expected no defensive stance actions when already active, but got %d", len(defensiveActions))
	}
}

func TestDefensiveStanceAlreadyUsedAbility(t *testing.T) {
	// Create a unit with the Defensive Stance ability
	defensiveStanceAbility := core.Ability{
		ID:          "00002-defensive-stance",
		Label:       core.Text{"en-EN": "Defensive Stance"},
		Description: core.Text{"en-EN": "The next point of damage dealt to this unit is canceled. This effect cannot be stacked multiple times."},
		Cost:        3,
	}

	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Reach:  1,
				Move:   2,
				Attack: 2,
			},
			Abilities: []core.Ability{defensiveStanceAbility},
		},
	}

	// Create game state where unit has already used an ability
	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 0, Y: 0}},
		Board:           map[string]UnitID{"0,0": 1},
		Units:           map[UnitID]*PlayerUnit{1: unit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set that the unit has already used an ability this round
	state.Set(1, CounterRoundAbilities, 1)

	// Get possible defensive stance actions
	defensiveActions := getPossibleDefensiveStances(state, unit)

	// Should have no defensive stance actions available
	if len(defensiveActions) != 0 {
		t.Errorf("Expected no defensive stance actions when ability already used, but got %d", len(defensiveActions))
	}
}
