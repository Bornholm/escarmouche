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
		tid := targetID
		energyTraitAction := NewAbilityAction("00001-energy-trait", func(state GameState, action Action) GameState {
			state, _ = applyDamage(state, tid, 2)
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		}, &AbilityActionDescription{
			ID:           "00001-energy-trait",
			SourceUnitID: unit.ID,
			TargetUnitID: targetID,
			TargetX:      -1,
			TargetY:      -1,
		})
		actions = append(actions, energyTraitAction)
	}

	return actions
}
