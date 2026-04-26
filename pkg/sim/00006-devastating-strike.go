package sim

func init() {
	registerAbility("00006-devastating-strike", getPossibleDevastatingStrikes)
}

func getPossibleDevastatingStrikes(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, currentPos, 1)

	actions := make([]Action, 0, len(reachableTargets))
	for _, targetID := range reachableTargets {
		tid := targetID
		action := NewAbilityAction("00006-devastating-strike", func(state GameState, _ Action) GameState {
			state, _ = applyDamage(state, tid, 4)
			state, _ = applyDamage(state, unit.ID, 1)
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		})
		actions = append(actions, action)
	}
	return actions
}
