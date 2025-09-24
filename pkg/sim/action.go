package sim

import "fmt"

type ActionType string

const (
	ActionMove   ActionType = "move"
	ActionAttack ActionType = "attack"
)

type Action interface {
	Type() ActionType
	Apply(state GameState) GameState
	String() string
}

type MoveAction struct {
	unitID    UnitID
	targetPos Position
}

func NewMoveAction(unitID UnitID, targetPos Position) *MoveAction {
	return &MoveAction{
		unitID:    unitID,
		targetPos: targetPos,
	}
}

// Apply implements Action.
func (a *MoveAction) Apply(state GameState) GameState {
	unit := state.Units[a.unitID]

	delete(state.Board, state.Positions[unit.ID].String())
	state.Positions[unit.ID] = a.targetPos
	state.Board[a.targetPos.String()] = unit.ID

	return state
}

// Type implements Action.
func (a *MoveAction) Type() ActionType {
	return ActionMove
}

// String implements Action.
func (a *MoveAction) String() string {
	return fmt.Sprintf("move %d -> %s", a.unitID, a.targetPos)
}

var _ Action = &MoveAction{}

type AttackAction struct {
	unitID   UnitID
	targetID UnitID
}

func NewAttackAction(unitID UnitID, targetID UnitID) *AttackAction {
	return &AttackAction{
		unitID:   unitID,
		targetID: targetID,
	}
}

// Apply implements Action.
func (a *AttackAction) Apply(state GameState) GameState {
	unit := state.Units[a.unitID]

	state.Healths[a.targetID] -= unit.Stats.Attack

	if state.Healths[a.targetID] <= 0 {
		delete(state.Healths, a.targetID)
		delete(state.Board, state.Positions[a.targetID].String())
		delete(state.Positions, a.targetID)
		delete(state.Units, a.targetID)
	}

	return state
}

// Type implements Action.
func (a *AttackAction) Type() ActionType {
	return ActionAttack
}

// String implements Action.
func (a *AttackAction) String() string {
	return fmt.Sprintf("attack %d -> %d", a.unitID, a.targetID)
}

var _ Action = &AttackAction{}
