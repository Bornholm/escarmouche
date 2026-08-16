package sim

func init() {
	registerAbility("00008-guardian", getPossibleGuardians)
}

func getPossibleGuardians(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	actions := make([]Action, 0)

	for allyID, ally := range state.Units {
		if ally.OwnerID != unit.OwnerID || allyID == unit.ID {
			continue
		}
		allyPos := state.Positions[allyID]
		if int(distance(currentPos, allyPos)) > 1 {
			continue
		}

		aid := allyID
		action := NewAbilityAction("00008-guardian", func(state GameState, _ Action) GameState {
			state.Set(unit.ID, CounterGuardianOf, int(aid))
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		}, &AbilityActionDescription{
			ID:           "00008-guardian",
			SourceUnitID: unit.ID,
			TargetUnitID: allyID,
			TargetX:      -1,
			TargetY:      -1,
		})
		actions = append(actions, action)
	}
	return actions
}
