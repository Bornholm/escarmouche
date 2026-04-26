package sim

func init() {
	registerAbility("00009-sweep", getPossibleSweeps)
}

func getPossibleSweeps(state GameState, unit *PlayerUnit) []Action {
	if state.Get(unit.ID, CounterRoundAbilities, 0) > 0 {
		return nil
	}

	currentPos := state.Positions[unit.ID]
	adjacentEnemies := make([]UnitID, 0)

	for uid, u := range state.Units {
		if u.OwnerID == unit.OwnerID {
			continue
		}
		ePos := state.Positions[uid]
		if abs(ePos.X-currentPos.X) <= 1 && abs(ePos.Y-currentPos.Y) <= 1 {
			adjacentEnemies = append(adjacentEnemies, uid)
		}
	}

	if len(adjacentEnemies) == 0 {
		return nil
	}

	enemies := adjacentEnemies
	action := NewAbilityAction("00009-sweep", func(state GameState, _ Action) GameState {
		for _, tid := range enemies {
			state, _ = applyDamage(state, tid, 1)
		}
		state.Inc(unit.ID, CounterRoundAbilities, 1)
		return state
	})
	return []Action{action}
}
