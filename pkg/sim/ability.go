package sim

import (
	"fmt"

	"github.com/pkg/errors"
)

type ApplyFunc func(state GameState, action Action) GameState

const (
	ActionAbility ActionType = "ability"
)

type AbilityAction struct {
	id    string
	apply ApplyFunc
}

// String implements Action.
func (a *AbilityAction) String() string {
	return fmt.Sprintf("ability:%s", a.id)
}

// Apply implements Action.
func (a *AbilityAction) Apply(state GameState) GameState {
	return a.apply(state, a)
}

// Type implements Action.
func (a *AbilityAction) Type() ActionType {
	return ActionAbility
}

func NewAbilityAction(id string, apply ApplyFunc) *AbilityAction {
	return &AbilityAction{
		id:    id,
		apply: apply,
	}
}

var _ Action = &AbilityAction{}

type GetValidActionsFunc func(state GameState, unit *PlayerUnit) []Action
type AbilityRegistry struct {
	abilities map[string]GetValidActionsFunc
}

func (r *AbilityRegistry) Register(id string, fn GetValidActionsFunc) {
	r.abilities[id] = fn
}

var defaultAbilityRegistry = NewAbilityRegistry()

func registerAbility(id string, fn GetValidActionsFunc) {
	defaultAbilityRegistry.Register(id, fn)
}

func getPossibleAbilities(state GameState, unit *PlayerUnit) []Action {
	return defaultAbilityRegistry.GetPossibleActions(state, unit)
}

func NewAbilityRegistry() *AbilityRegistry {
	return &AbilityRegistry{
		abilities: map[string]GetValidActionsFunc{},
	}
}

func (r *AbilityRegistry) GetPossibleActions(state GameState, unit *PlayerUnit) []Action {
	actions := make([]Action, 0)

	for _, ability := range unit.Abilities {
		getValidActions, exists := r.abilities[ability.ID]
		if !exists {
			panic(errors.Errorf("no registered '%s' ability", ability.ID))
		}

		actions = append(actions, getValidActions(state, unit)...)
	}

	return actions
}
