package sim

func init() {
	registerAbility("00002-defensive-stance", getPossibleDefensiveStances)
}

func getPossibleDefensiveStances(state GameState, unit *PlayerUnit) []Action {
	actions := []Action{}

	// Check if unit has already used abilities this round
	roundAbilities := state.Get(unit.ID, CounterRoundAbilities, 0)
	if roundAbilities > 0 {
		return actions
	}

	// Check if unit already has defensive stance active (cannot stack)
	defensiveStance := state.Get(unit.ID, CounterDefensiveStance, 0)
	if defensiveStance > 0 {
		return actions
	}

	// Create a defensive stance action that applies the defensive buff
	defensiveStanceAction := NewAbilityAction("00002-defensive-stance", func(state GameState, action Action) GameState {
		// Apply defensive stance effect (next damage point will be canceled)
		state.Set(unit.ID, CounterDefensiveStance, 1)

		// Mark that the unit has used an ability this round
		state.Inc(unit.ID, CounterRoundAbilities, 1)

		return state
	})

	actions = append(actions, defensiveStanceAction)

	return actions
}
