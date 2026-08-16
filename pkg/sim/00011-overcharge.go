package sim

func init() {
	registerAbility("00011-overcharge", getPossibleOvercharges)
}

func getPossibleOvercharges(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, currentPos, unit.Stats.Range)

	actions := make([]Action, 0, len(reachableTargets))
	for _, targetID := range reachableTargets {
		tid := targetID
		action := NewAbilityAction("00011-overcharge", func(state GameState, _ Action) GameState {
			state, _ = applyDamage(state, tid, unit.Stats.Power)
			state.Set(unit.ID, CounterOverchargePending, 1)
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		}, &AbilityActionDescription{
			ID:           "00011-overcharge",
			SourceUnitID: unit.ID,
			TargetUnitID: targetID,
			TargetX:      -1,
			TargetY:      -1,
		})
		actions = append(actions, action)
	}
	return actions
}
