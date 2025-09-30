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
		reachableTargets := getReachableOpponentUnits(state, unit.OwnerID, targetPos, unit.Stats.Reach)

		for _, targetID := range reachableTargets {
			// Create a charge action that combines movement + power 1 attack
			chargeAction := NewAbilityAction("00000-charge", func(state GameState, action Action) GameState {
				// First, perform the movement
				delete(state.Board, state.Positions[unit.ID].String())
				state.Positions[unit.ID] = targetPos
				state.Board[targetPos.String()] = unit.ID

				// Then, perform a power 1 attack (1 damage regardless of unit's attack stat)
				state, _ = applyDamage(state, targetID, 1)

				// Mark that the unit has used an ability this round
				state.Inc(unit.ID, CounterRoundAbilities, 1)

				return state
			})

			actions = append(actions, chargeAction)
		}
	}

	return actions
}
