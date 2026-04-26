package sim

func init() {
	registerAbility("00005-command-forward", getPossibleCommandForwards)
}

func getPossibleCommandForwards(state GameState, unit *PlayerUnit) []Action {
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
		if int(distance(currentPos, allyPos)) > 3 {
			continue
		}

		reachable := getReachablePositions(state, allyPos, ally.Stats.Move)
		for _, targetPos := range reachable {
			tp := targetPos
			aid := allyID
			action := NewAbilityAction("00005-command-forward", func(state GameState, _ Action) GameState {
				delete(state.Board, state.Positions[aid].String())
				state.Positions[aid] = tp
				state.Board[tp.String()] = aid
				state.Inc(unit.ID, CounterRoundAbilities, 1)
				return state
			})
			actions = append(actions, action)
		}
	}
	return actions
}
