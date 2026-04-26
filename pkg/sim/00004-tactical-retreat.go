package sim

func init() {
	registerAbility("00004-tactical-retreat", getPossibleTacticalRetreats)
}

func getPossibleTacticalRetreats(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	reachablePositions := getReachablePositions(state, currentPos, unit.Stats.Move)

	actions := make([]Action, 0, len(reachablePositions))
	for _, targetPos := range reachablePositions {
		tp := targetPos
		action := NewAbilityAction("00004-tactical-retreat", func(state GameState, _ Action) GameState {
			delete(state.Board, state.Positions[unit.ID].String())
			state.Positions[unit.ID] = tp
			state.Board[tp.String()] = unit.ID
			state.Set(unit.ID, CounterUntargetable, 2)
			state.Inc(unit.ID, CounterRoundAbilities, 1)
			return state
		})
		actions = append(actions, action)
	}
	return actions
}
