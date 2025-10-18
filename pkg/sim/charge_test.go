package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestChargeAbility(t *testing.T) {
	// Create a unit with the Charge ability
	chargeAbility := core.Ability{
		ID:          "00000-charge",
		Label:       core.Text{"en-EN": "Charge"},
		Description: core.Text{"en-EN": "Perform a free movement action, then make a power 1 attack."},
		Cost:        3,
	}

	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Range:  1,
				Move:   2,
				Power:  2,
			},
			Abilities: []core.Ability{chargeAbility},
		},
	}

	// Create an enemy unit
	enemyUnit := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 2,
				Range:  1,
				Move:   1,
				Power:  1,
			},
			Abilities: []core.Ability{},
		},
	}

	// Create game state
	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{1: {X: 0, Y: 0}, 2: {X: 3, Y: 0}},
		Board:           map[string]UnitID{"0,0": 1, "3,0": 2},
		Units:           map[UnitID]*PlayerUnit{1: unit, 2: enemyUnit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set initial health
	state.Set(1, CounterHealth, 3)
	state.Set(2, CounterHealth, 2)

	// Get possible charge actions
	chargeActions := getPossibleCharges(state, unit)

	// Should have charge actions available
	if len(chargeActions) == 0 {
		t.Fatal("Expected charge actions to be available, but got none")
	}

	t.Logf("Found %d charge actions", len(chargeActions))

	// Test applying a charge action
	chargeAction := chargeActions[0]
	newState := chargeAction.Apply(state.Copy())

	// Verify the unit moved and the enemy took 1 damage
	if newState.Positions[1].X == 0 && newState.Positions[1].Y == 0 {
		t.Error("Unit should have moved from its original position")
	}

	enemyHealth := newState.Get(2, CounterHealth, 2)
	if enemyHealth != 1 {
		t.Errorf("Enemy should have 1 health after charge attack, but has %d", enemyHealth)
	}

	// Verify the unit used an ability this round
	roundAbilities := newState.Get(1, CounterRoundAbilities, 0)
	if roundAbilities != 1 {
		t.Errorf("Unit should have used 1 ability this round, but used %d", roundAbilities)
	}

	t.Logf("Charge action applied successfully: %s", chargeAction.String())
}

func TestChargeAbilityAlreadyUsed(t *testing.T) {
	// Create a unit with the Charge ability
	chargeAbility := core.Ability{
		ID:          "00000-charge",
		Label:       core.Text{"en-EN": "Charge"},
		Description: core.Text{"en-EN": "Perform a free movement action, then make a power 1 attack."},
		Cost:        3,
	}

	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Range:  1,
				Move:   2,
				Power:  2,
			},
			Abilities: []core.Ability{chargeAbility},
		},
	}

	// Create game state where unit has already used an ability
	state := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{'1': {X: 0, Y: 0}},
		Board:           map[string]UnitID{"0,0": '1'},
		Units:           map[UnitID]*PlayerUnit{'1': unit},
		CurrentPlayerID: PlayerOne,
		ActionsLeft:     2,
	}

	// Set that the unit has already used an ability this round
	state.Set(1, CounterRoundAbilities, 1)

	// Get possible charge actions
	chargeActions := getPossibleCharges(state, unit)

	// Should have no charge actions available
	if len(chargeActions) != 0 {
		t.Errorf("Expected no charge actions when ability already used, but got %d", len(chargeActions))
	}
}
