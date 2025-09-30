package sim

func init() {
	registerAbility("00001-energy-trait", getPossibleEnergyTraits)
}

func getPossibleEnergyTraits(state GameState, unit *PlayerUnit) []Action {
	actions := []Action{}

	// Check if unit has already used abilities this round
	roundAbilities := state.Get(unit.ID, CounterRoundAbilities, 0)
	if roundAbilities > 0 {
		return actions
	}

	currentPos := state.Positions[unit.ID]

	// Find all reachable opponent units within range 3
	reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, currentPos, 3)

	for _, targetID := range reachableTargets {
		// Create an energy trait action that performs a power 2 attack
		energyTraitAction := NewAbilityAction("00001-energy-trait", func(state GameState, action Action) GameState {
			// Perform a power 2 attack (2 damage regardless of unit's attack stat)
			state, _ = applyDamage(state, targetID, 2)

			// Mark that the unit has used an ability this round
			state.Inc(unit.ID, CounterRoundAbilities, 1)

			return state
		})

		actions = append(actions, energyTraitAction)
	}

	return actions
}
