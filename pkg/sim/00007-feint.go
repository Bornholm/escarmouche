package sim

func init() {
	registerAbility("00007-feint", getPossibleFeints)
}

func getPossibleFeints(state GameState, unit *PlayerUnit) []Action {
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
		if int(distance(currentPos, allyPos)) > 2 {
			continue
		}
		if !hasLineOfSight(state, currentPos, allyPos) {
			continue
		}

		aid := allyID
		action := NewAbilityAction("00007-feint", func(state GameState, _ Action) GameState {
			unitPos := state.Positions[unit.ID]
			swapPos := state.Positions[aid]

			delete(state.Board, unitPos.String())
			delete(state.Board, swapPos.String())

			state.Positions[unit.ID] = swapPos
			state.Positions[aid] = unitPos

			state.Board[swapPos.String()] = unit.ID
			state.Board[unitPos.String()] = aid

			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		}, &AbilityActionDescription{
			ID:           "00007-feint",
			SourceUnitID: unit.ID,
			TargetUnitID: allyID,
			TargetX:      -1,
			TargetY:      -1,
		})
		actions = append(actions, action)
	}
	return actions
}
