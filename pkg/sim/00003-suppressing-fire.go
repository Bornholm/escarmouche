package sim

func init() {
	registerAbility("00003-suppressing-fire", getPossibleSuppressions)
}

func getPossibleSuppressions(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, currentPos, 4)

	actions := make([]Action, 0, len(reachableTargets))
	for _, targetID := range reachableTargets {
		tid := targetID
		action := NewAbilityAction("00003-suppressing-fire", func(state GameState, _ Action) GameState {
			var remainingHealth int
			state, remainingHealth = applyDamage(state, tid, 1)
			if remainingHealth > 0 {
				state.Set(tid, CounterSuppressed, 2)
			}
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		})
		actions = append(actions, action)
	}
	return actions
}
