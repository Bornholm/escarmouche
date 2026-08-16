package sim

func init() {
	registerAbility("00000-charge", getPossibleCharges)
}

func getPossibleCharges(state GameState, unit *PlayerUnit) []Action {
	actions := []Action{}

	// Check if unit has already used abilities this round
	roundAbilities := state.Get(unit.ID, CounterRoundAbilities, 0)
	if roundAbilities > 0 {
		return actions
	}

	currentPos := state.Positions[unit.ID]

	// Get all reachable positions using the new pathfinding system
	reachablePositions := getReachablePositions(state, currentPos, unit.Stats.Move)

	for _, targetPos := range reachablePositions {
		// From this movement position, find all possible attack targets within reach
		reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, targetPos, unit.Stats.Range)

		for _, targetID := range reachableTargets {
			// Create a charge action that combines movement + power 1 attack
			tp := targetPos
			tid := targetID
			chargeAction := NewAbilityAction("00000-charge", func(state GameState, action Action) GameState {
				delete(state.Board, state.Positions[unit.ID].String())
				state.Positions[unit.ID] = tp
				state.Board[tp.String()] = unit.ID
				state, _ = applyDamage(state, tid, 1)
				state.Inc(unit.ID, CounterRoundAbilities, 1)
				return state
			}, &AbilityActionDescription{
				ID:           "00000-charge",
				SourceUnitID: unit.ID,
				TargetUnitID: targetID,
				TargetX:      targetPos.X,
				TargetY:      targetPos.Y,
			})

			actions = append(actions, chargeAction)
		}
	}

	return actions
}
