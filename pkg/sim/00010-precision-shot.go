package sim

func init() {
	registerAbility("00010-precision-shot", getPossiblePrecisionShots)
}

func getPossiblePrecisionShots(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	reachableTargets := getOpponentsInRange(state, unit.OwnerID, currentPos, unit.Stats.Range)

	actions := make([]Action, 0, len(reachableTargets))
	for _, targetID := range reachableTargets {
		tid := targetID
		action := NewAbilityAction("00010-precision-shot", func(state GameState, _ Action) GameState {
			state, _ = applyDamage(state, tid, 2)
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		})
		actions = append(actions, action)
	}
	return actions
}
