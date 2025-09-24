package sim

import (
	"embed"
	"io/fs"
	"path/filepath"
	"strings"
	"sync"

	"github.com/pkg/errors"
)

const (
	ActionAbility ActionType = "ability"
)

//go:embed abilities/*.js
var abilitiesFS embed.FS

type AbilityAction struct {
}

// String implements Action.
func (a *AbilityAction) String() string {
	panic("unimplemented")
}

// Apply implements Action.
func (a *AbilityAction) Apply(state GameState) GameState {
	panic("unimplemented")
}

// Type implements Action.
func (a *AbilityAction) Type() ActionType {
	panic("unimplemented")
}

var _ Action = &AbilityAction{}

var (
	abilities map[string]string
	loadOnce  sync.Once
)

func loadAbilities() {
	loadOnce.Do(func() {
		abilities = map[string]string{}

		files, err := fs.Glob(abilitiesFS, "abilities/*.js")
		if err != nil {
			panic(errors.Wrap(err, "could not find abilities"))
		}

		for _, f := range files {
			id := strings.TrimSuffix(filepath.Base(f), filepath.Ext(f))

			data, err := fs.ReadFile(abilitiesFS, f)
			if err != nil {
				panic(errors.Wrap(err, "could not read ability"))
			}

			abilities[id] = string(data)
		}
	})
}
